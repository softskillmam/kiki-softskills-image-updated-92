
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, Upload, ArrowLeft, Loader2, Tag } from 'lucide-react';

interface CartItem {
  id: string;
  course: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
  };
}

interface CheckoutData {
  items: CartItem[];
  subtotal: number;
  couponCode?: string;
  couponDiscount?: number;
  total: number;
}

const Checkout = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [upiApp, setUpiApp] = useState('');
  const [paymentScreenshot, setPaymentScreenshot] = useState<File | null>(null);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // MBTI Career Test Course ID
  const MBTI_COURSE_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Try to get checkout data from sessionStorage first
    const storedCheckoutData = sessionStorage.getItem('checkoutData');
    if (storedCheckoutData) {
      try {
        const parsed = JSON.parse(storedCheckoutData);
        setCheckoutData(parsed);
        setCartItems(parsed.items || []);
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing stored checkout data:', error);
      }
    }
    
    // Fallback to fetching from database
    fetchCartItems();
  }, [isAuthenticated, navigate]);

  const fetchCartItems = async () => {
    if (!user) return;
    
    try {
      console.log('Fetching cart items for user:', user.id);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          course:courses (
            id,
            title,
            price,
            image_url
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart items:', error);
        toast({
          title: "Error",
          description: "Failed to load cart items.",
          variant: "destructive",
        });
        return;
      }

      console.log('Cart items fetched:', data);
      setCartItems(data || []);
      
      // Create checkout data from fetched items
      const subtotal = (data || []).reduce((sum, item) => sum + item.course.price, 0);
      setCheckoutData({
        items: data || [],
        subtotal,
        total: subtotal
      });
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }
      
      setPaymentScreenshot(file);
    }
  };

  const uploadPaymentScreenshot = async (orderId: string): Promise<string | null> => {
    if (!paymentScreenshot || !user) return null;

    try {
      const fileExt = paymentScreenshot.name.split('.').pop();
      const fileName = `${user.id}/${orderId}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, paymentScreenshot);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading payment screenshot:', error);
      throw error;
    }
  };

  const createEnrollment = async (courseId: string) => {
    if (!user?.id) return;

    try {
      console.log('Creating enrollment for course:', courseId);
      
      // Check if enrollment already exists
      const { data: existingEnrollment, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing enrollment:', checkError);
        throw checkError;
      }

      if (existingEnrollment) {
        console.log('Enrollment already exists:', existingEnrollment);
        return;
      }

      // Create new enrollment
      const { data: enrollment, error: enrollmentError } = await supabase
        .from('enrollments')
        .insert({
          student_id: user.id,
          course_id: courseId,
          status: 'enrolled',
          progress: 0,
          completed_lessons: 0,
          enrolled_at: new Date().toISOString()
        })
        .select()
        .single();

      if (enrollmentError) {
        console.error('Error creating enrollment:', enrollmentError);
        throw enrollmentError;
      }

      console.log('Enrollment created successfully:', enrollment);
    } catch (error) {
      console.error('Error in createEnrollment:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || cartItems.length === 0 || !checkoutData) return;

    // Check if MBTI test is in cart and if payment screenshot is required
    const hasMBTITest = cartItems.some(item => item.course.id === MBTI_COURSE_ID);
    const hasOtherCourses = cartItems.some(item => item.course.id !== MBTI_COURSE_ID);
    
    console.log('Cart analysis:', { hasMBTITest, hasOtherCourses, cartItems });

    if (!hasMBTITest && !paymentScreenshot) {
      toast({
        title: "Payment Screenshot Required",
        description: "Please upload a payment screenshot to complete your order.",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === 'UPI' && !upiApp && !hasMBTITest) {
      toast({
        title: "UPI App Required",
        description: "Please select which UPI app you used for payment.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      console.log('Creating order with checkout data:', checkoutData);

      // Create order with appropriate status
      const orderStatus = hasMBTITest && !hasOtherCourses ? 'confirmed' : 'pending';
      
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: checkoutData.total,
          status: orderStatus,
          payment_method: paymentMethod,
          upi_app: upiApp || null,
        })
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created:', order);

      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        course_id: item.course.id,
        price: item.course.price,
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) {
        console.error('Error creating order items:', orderItemsError);
        throw orderItemsError;
      }

      console.log('Order items created');

      // Upload payment screenshot if provided
      let screenshotUrl = null;
      if (paymentScreenshot) {
        screenshotUrl = await uploadPaymentScreenshot(order.id);
        
        // Update order with screenshot URL
        const { error: updateError } = await supabase
          .from('orders')
          .update({ payment_screenshot_url: screenshotUrl })
          .eq('id', order.id);

        if (updateError) {
          console.error('Error updating order with screenshot:', updateError);
        }
      }

      // Create enrollments for all courses in cart (MBTI gets immediate access)
      for (const item of cartItems) {
        try {
          await createEnrollment(item.course.id);
        } catch (enrollmentError) {
          console.error(`Error creating enrollment for course ${item.course.id}:`, enrollmentError);
          // Continue with other enrollments even if one fails
        }
      }

      // Clear cart
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) {
        console.error('Error clearing cart:', clearCartError);
      }

      // Clear checkout data from sessionStorage
      sessionStorage.removeItem('checkoutData');

      toast({
        title: "Order Placed Successfully!",
        description: hasMBTITest && !hasOtherCourses 
          ? "You can now access the MBTI test immediately." 
          : hasOtherCourses
          ? "Your order has been submitted. Regular courses require admin approval, but MBTI test is available immediately."
          : "Your order has been submitted. You'll receive confirmation once approved.",
      });

      // Redirect based on order contents
      if (hasMBTITest) {
        navigate('/career-test');
      } else {
        navigate('/enrolled-courses');
      }

    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const hasMBTITest = cartItems.some(item => item.course.id === MBTI_COURSE_ID);
  const hasOtherCourses = cartItems.some(item => item.course.id !== MBTI_COURSE_ID);

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-kiki-purple-600" />
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-4">Add some courses to get started!</p>
              <Button onClick={() => navigate('/programs')}>
                Browse Programs
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Cart
            </Button>
            <h1 className="text-3xl font-bold">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="w-16 h-16 bg-gradient-to-br from-kiki-purple-100 to-kiki-blue-100 rounded-lg flex items-center justify-center">
                        {item.course.image_url ? (
                          <img 
                            src={item.course.image_url} 
                            alt={item.course.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <div className="text-2xl">📚</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.course.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-kiki-purple-600">
                            ₹{item.course.price}
                          </span>
                          {item.course.id === MBTI_COURSE_ID && (
                            <Badge className="bg-green-100 text-green-800">
                              Instant Access
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Separator />
                  
                  {/* Price Breakdown */}
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>₹{checkoutData?.subtotal || 0}</span>
                    </div>
                    
                    {checkoutData?.couponCode && checkoutData?.couponDiscount && (
                      <div className="flex items-center justify-between text-green-600">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4" />
                          <span>Coupon ({checkoutData.couponCode}):</span>
                        </div>
                        <span>-₹{checkoutData.couponDiscount}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-kiki-purple-600">₹{checkoutData?.total || 0}</span>
                    </div>
                  </div>

                  {hasMBTITest && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-800">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="font-medium">MBTI Test - Instant Access</span>
                      </div>
                      <p className="text-sm text-green-700 mt-1">
                        You'll get immediate access to the MBTI test after checkout.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {paymentMethod === 'UPI' && !hasMBTITest && (
                    <div>
                      <Label htmlFor="upi-app">UPI App Used</Label>
                      <Select value={upiApp} onValueChange={setUpiApp}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select UPI app" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="googlepay">Google Pay</SelectItem>
                          <SelectItem value="phonepe">PhonePe</SelectItem>
                          <SelectItem value="paytm">Paytm</SelectItem>
                          <SelectItem value="bhim">BHIM</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {!hasMBTITest && (
                    <div>
                      <Label htmlFor="payment-screenshot">Payment Screenshot *</Label>
                      <div className="mt-2">
                        <Input
                          id="payment-screenshot"
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          required
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Upload a screenshot of your payment confirmation (max 5MB)
                        </p>
                        {paymentScreenshot && (
                          <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                            <Upload className="h-3 w-3" />
                            {paymentScreenshot.name}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <p>• UPI ID: <strong>kiki@paytm</strong></p>
                      <p>• Amount: <strong>₹{checkoutData?.total || 0}</strong></p>
                      {!hasMBTITest && (
                        <p>• After payment, upload the screenshot above</p>
                      )}
                      {hasOtherCourses && (
                        <p>• Regular courses require admin approval</p>
                      )}
                      {hasMBTITest && (
                        <p>• MBTI test access is granted immediately</p>
                      )}
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Complete Order'
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;
