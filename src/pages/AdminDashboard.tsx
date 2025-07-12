
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, CreditCard, LogOut, Loader2, Eye, Tag, AlertCircle } from 'lucide-react';
import CourseManagement from '@/components/CourseManagement';
import EnrollmentManagement from '@/components/EnrollmentManagement';
import AdminSectionManagement from '@/components/AdminSectionManagement';
import NotificationBell from '@/components/NotificationBell';
import AdminSearchableTab from '@/components/AdminSearchableTab';
import CouponManagement from '@/components/CouponManagement';

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
}

interface Course {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalOrders: 0,
    totalRevenue: 0
  });
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else if (!loading) {
      // User is not logged in
      navigate('/admin/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    setFilteredUsers(recentUsers);
  }, [recentUsers]);

  const handleUserSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers(recentUsers);
      return;
    }
    
    const filtered = recentUsers.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const checkAdminStatus = async () => {
    try {
      console.log('Checking admin status for user:', user?.id);
      
      if (!user?.id) {
        throw new Error('No user ID available');
      }

      // First check if we can access the profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error checking profile:', profileError);
        setAdminCheckError(`Profile check failed: ${profileError.message}`);
        
        // Try to create profile if it doesn't exist
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, attempting to create...');
          const { error: insertError } = await supabase
            .from('profiles')
            .insert([{
              id: user.id,
              email: user.email || '',
              role: 'student' // Default role
            }]);
          
          if (insertError) {
            console.error('Error creating profile:', insertError);
            setAdminCheckError(`Failed to create profile: ${insertError.message}`);
          } else {
            setAdminCheckError('Profile created with student role. Contact admin to upgrade permissions.');
          }
        }
        return;
      }

      console.log('User profile:', profile);

      if (profile?.role !== 'admin') {
        setAdminCheckError(`Access denied. Your role is: ${profile?.role || 'unknown'}`);
        toast({
          title: "Access Denied",
          description: `You don't have admin permissions. Your role: ${profile?.role || 'unknown'}`,
          variant: "destructive",
        });
        // Don't navigate away immediately, show the error
        return;
      }

      setIsAdmin(true);
      setAdminCheckError(null);
      await fetchDashboardData();
    } catch (error: any) {
      console.error('Error checking admin status:', error);
      setAdminCheckError(error.message || 'Unknown error occurred');
      toast({
        title: "Error",
        description: error.message || "Failed to verify admin status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...');
      
      // Fetch stats
      const [usersResult, coursesResult, ordersResult] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact' }),
        supabase.from('courses').select('*', { count: 'exact' }),
        supabase.from('orders').select('total_amount', { count: 'exact' })
      ]);

      console.log('Stats results:', { usersResult, coursesResult, ordersResult });

      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      setStats({
        totalUsers: usersResult.count || 0,
        totalCourses: coursesResult.count || 0,
        totalOrders: ordersResult.count || 0,
        totalRevenue
      });

      // Fetch recent data
      const [recentUsersData, recentCoursesData] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(10),
        supabase.from('courses').select('*').order('created_at', { ascending: false }).limit(5)
      ]);

      console.log('Recent data:', { recentUsersData, recentCoursesData });

      setRecentUsers(recentUsersData.data || []);
      setRecentCourses(recentCoursesData.data || []);

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-600 mx-auto mb-4" />
          <p className="text-gray-600">Checking admin permissions...</p>
        </div>
      </div>
    );
  }

  if (adminCheckError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Access Issue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-700">{adminCheckError}</p>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/')} variant="outline">
                Go Home
              </Button>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
            <p className="text-gray-600">Manage users, courses, and system settings</p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Site
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-6 lg:grid-cols-6">
            <TabsTrigger value="users" className="text-xs lg:text-sm px-2">Users</TabsTrigger>
            <TabsTrigger value="courses" className="text-xs lg:text-sm px-2">Courses</TabsTrigger>
            <TabsTrigger value="enrollments" className="text-xs lg:text-sm px-2">Enrollments</TabsTrigger>
            <TabsTrigger value="sections" className="text-xs lg:text-sm px-2">Sections</TabsTrigger>
            <TabsTrigger value="coupons" className="text-xs lg:text-sm px-2">Coupons</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs lg:text-sm px-2">Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  View and manage all registered users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AdminSearchableTab 
                  onSearch={handleUserSearch}
                  placeholder="Search by name, email, or role..."
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.full_name || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                              {user.role}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                      {filteredUsers.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                            No users found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </AdminSearchableTab>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="courses" className="space-y-4">
            <CourseManagement />
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-4">
            <EnrollmentManagement />
          </TabsContent>

          <TabsContent value="sections" className="space-y-4">
            <AdminSectionManagement />
          </TabsContent>

          <TabsContent value="coupons" className="space-y-4">
            <CouponManagement />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports & Analytics</CardTitle>
                <CardDescription>
                  Detailed reports and analytics dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8">
                  Reports section coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
