import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Brain, Users, Lightbulb, Target, BookOpen, Star, TrendingUp, Heart, Zap, Shield } from 'lucide-react';

interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  aValue: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
  bValue: 'E' | 'I' | 'S' | 'N' | 'T' | 'F' | 'J' | 'P';
}

interface MBTIResult {
  type: string;
  scores: {
    E: number;
    I: number;
    S: number;
    N: number;
    T: number;
    F: number;
    J: number;
    P: number;
  };
}

interface Career {
  career_title: string;
  description: string;
  industry: string;
}

interface CourseRecommendation {
  skill_title: string;
  description: string;
  category: string;
}

// MBTI type definition to match database enum
type MBTIType = 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP' | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP' | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ' | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

const questions: Question[] = [
  // Extraversion vs Introversion (12 questions)
  { id: 1, question: "At a party, you would rather:", optionA: "Interact with many people", optionB: "Talk to a few close friends", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 2, question: "You feel more energized by:", optionA: "Being around people", optionB: "Spending time alone", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 3, question: "When making decisions, you:", optionA: "Talk it through with others", optionB: "Think it through privately", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 4, question: "In group projects, you prefer to:", optionA: "Lead discussions", optionB: "Work independently first", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 5, question: "You are more comfortable with:", optionA: "Speaking in public", optionB: "Writing your thoughts", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 6, question: "After a long day, you prefer to:", optionA: "Go out with friends", optionB: "Stay home and relax", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 7, question: "You tend to:", optionA: "Think out loud", optionB: "Think before speaking", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 8, question: "In conversations, you:", optionA: "Share personal details easily", optionB: "Keep personal matters private", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 9, question: "You work better:", optionA: "With background noise", optionB: "In complete silence", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 10, question: "When stressed, you:", optionA: "Seek support from others", optionB: "Deal with it alone", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 11, question: "You prefer to:", optionA: "Have many acquaintances", optionB: "Have few close friends", dimension: 'EI', aValue: 'E', bValue: 'I' },
  { id: 12, question: "In meetings, you:", optionA: "Speak up frequently", optionB: "Listen more than talk", dimension: 'EI', aValue: 'E', bValue: 'I' },

  // Sensing vs Intuition (12 questions)
  { id: 13, question: "You prefer information that is:", optionA: "Concrete and factual", optionB: "Abstract and theoretical", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 14, question: "You focus more on:", optionA: "Present realities", optionB: "Future possibilities", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 15, question: "You trust more in:", optionA: "Experience", optionB: "Intuition", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 16, question: "You prefer to work with:", optionA: "Proven methods", optionB: "New approaches", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 17, question: "You are more interested in:", optionA: "Details and specifics", optionB: "The big picture", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 18, question: "You prefer instructions that are:", optionA: "Step-by-step", optionB: "General guidelines", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 19, question: "You are more drawn to:", optionA: "Practical applications", optionB: "Theoretical concepts", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 20, question: "When learning, you prefer:", optionA: "Hands-on experience", optionB: "Conceptual understanding", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 21, question: "You notice more:", optionA: "What is actually there", optionB: "What could be there", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 22, question: "You value more:", optionA: "Common sense", optionB: "Innovation", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 23, question: "You prefer to:", optionA: "Follow established procedures", optionB: "Explore new possibilities", dimension: 'SN', aValue: 'S', bValue: 'N' },
  { id: 24, question: "You are more likely to:", optionA: "Remember facts and details", optionB: "Remember impressions and meanings", dimension: 'SN', aValue: 'S', bValue: 'N' },

  // Thinking vs Feeling (12 questions)
  { id: 25, question: "When making decisions, you rely more on:", optionA: "Logic and analysis", optionB: "Personal values and feelings", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 26, question: "You are more concerned with:", optionA: "Being right", optionB: "Being tactful", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 27, question: "You value more:", optionA: "Justice and fairness", optionB: "Mercy and compassion", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 28, question: "In conflicts, you focus on:", optionA: "The issues at hand", optionB: "The people involved", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 29, question: "You prefer to be seen as:", optionA: "Competent", optionB: "Caring", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 30, question: "When giving feedback, you:", optionA: "Focus on improvement areas", optionB: "Consider the person's feelings", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 31, question: "You make decisions based on:", optionA: "Objective criteria", optionB: "Personal impact", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 32, question: "You are more motivated by:", optionA: "Achievement", optionB: "Appreciation", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 33, question: "In debates, you:", optionA: "Argue the facts", optionB: "Consider all viewpoints", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 34, question: "You prefer to:", optionA: "Be firm and tough-minded", optionB: "Be gentle and tender-hearted", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 35, question: "You are more interested in:", optionA: "Principles and laws", optionB: "People and their stories", dimension: 'TF', aValue: 'T', bValue: 'F' },
  { id: 36, question: "When criticized, you:", optionA: "Focus on the validity", optionB: "Feel personally affected", dimension: 'TF', aValue: 'T', bValue: 'F' },

  // Judging vs Perceiving (12 questions)
  { id: 37, question: "You prefer to:", optionA: "Plan ahead", optionB: "Be spontaneous", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 38, question: "You work better with:", optionA: "Deadlines", optionB: "Open-ended timeframes", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 39, question: "You prefer your life to be:", optionA: "Structured and organized", optionB: "Flexible and adaptable", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 40, question: "When starting a project, you:", optionA: "Make a detailed plan", optionB: "Jump right in", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 41, question: "You prefer to:", optionA: "Settle matters quickly", optionB: "Keep options open", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 42, question: "Your workspace tends to be:", optionA: "Neat and organized", optionB: "Flexible and varied", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 43, question: "You prefer to:", optionA: "Follow a schedule", optionB: "Go with the flow", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 44, question: "When making plans, you:", optionA: "Stick to them", optionB: "Change as needed", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 45, question: "You feel better when things are:", optionA: "Decided and settled", optionB: "Open to change", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 46, question: "You prefer assignments that are:", optionA: "Clear and specific", optionB: "Open to interpretation", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 47, question: "In your daily routine, you:", optionA: "Follow a set pattern", optionB: "Vary your activities", dimension: 'JP', aValue: 'J', bValue: 'P' },
  { id: 48, question: "You are more comfortable with:", optionA: "Having everything planned", optionB: "Leaving room for surprises", dimension: 'JP', aValue: 'J', bValue: 'P' }
];

interface MBTIQuizProps {
  onComplete: (result: MBTIResult) => void;
  isRetake?: boolean;
}

const PERSONALITY_DESCRIPTIONS = {
  'INTJ': {
    title: 'The Architect',
    description: 'Imaginative and strategic thinkers, with a plan for everything.',
    traits: ['Strategic', 'Independent', 'Decisive', 'Hard-working', 'Determined'],
    strengths: ['Quick to understand complex theoretical concepts', 'Highly independent', 'Natural leaders', 'High standards', 'Work well alone'],
    challenges: ['Can be overly critical', 'Impatient with inefficiency', 'May ignore emotions', 'Can be too theoretical'],
    workStyle: 'Prefer working independently on complex projects with long-term vision and strategic planning.'
  },
  'INTP': {
    title: 'The Thinker',
    description: 'Innovative inventors with an unquenchable thirst for knowledge.',
    traits: ['Logical', 'Abstract', 'Independent', 'Curious', 'Theoretical'],
    strengths: ['Excellent analytical abilities', 'Original thinking', 'Objective', 'Value precision'],
    challenges: ['May neglect practical matters', 'Can be insensitive', 'Difficulty with emotions'],
    workStyle: 'Thrive in flexible environments that allow for independent thinking and creative problem-solving.'
  },
  'ENTJ': {
    title: 'The Commander',
    description: 'Bold, imaginative and strong-willed leaders.',
    traits: ['Efficient', 'Energetic', 'Self-confident', 'Strong-willed', 'Strategic'],
    strengths: ['Natural born leaders', 'Self-assured', 'Well-informed', 'Excellent communicators'],
    challenges: ['Impatient', 'Arrogant', 'Poor handling of emotions', 'Cold and ruthless'],
    workStyle: 'Excel in leadership positions with opportunities to implement long-term strategies and manage teams.'
  },
  'ENTP': {
    title: 'The Debater',
    description: 'Smart and curious thinkers who cannot resist an intellectual challenge.',
    traits: ['Inventive', 'Enthusiastic', 'Strategic', 'Enterprising', 'Versatile'],
    strengths: ['Excellent brainstormers', 'Charismatic', 'Energetic', 'Good at many things'],
    challenges: ['Very argumentative', 'Insensitive', 'Intolerant', 'Can find it difficult to focus'],
    workStyle: 'Prefer dynamic environments with variety, intellectual challenges, and opportunities for innovation.'
  },
  'INFJ': {
    title: 'The Advocate',
    description: 'Creative and insightful, inspired and independent perfectionists.',
    traits: ['Insightful', 'Inspiring', 'Decisive', 'Determined', 'Passionate'],
    strengths: ['Creative', 'Insightful', 'Principled', 'Passionate', 'Altruistic'],
    challenges: ['Sensitive to criticism', 'Reluctant to open up', 'Perfectionist', 'Always need to have a cause'],
    workStyle: 'Work best in quiet environments focused on helping others and making a meaningful impact.'
  },
  'INFP': {
    title: 'The Mediator',
    description: 'Poetic, kind and altruistic people, always eager to help a good cause.',
    traits: ['Idealistic', 'Loyal', 'Adaptive', 'Curious', 'Caring'],
    strengths: ['Passionate and energetic', 'Flexible and laid-back', 'Loyal and devoted', 'Hard-working'],
    challenges: ['Too idealistic', 'Too altruistic', 'Impractical', 'Dislike dealing with data'],
    workStyle: 'Thrive in collaborative environments that align with personal values and allow creative expression.'
  },
  'ENFJ': {
    title: 'The Protagonist',
    description: 'Charismatic and inspiring leaders, able to mesmerize listeners.',
    traits: ['Tolerant', 'Reliable', 'Charismatic', 'Altruistic', 'Natural leader'],
    strengths: ['Tolerant', 'Reliable', 'Charismatic', 'Altruistic', 'Natural born leaders'],
    challenges: ['Overly idealistic', 'Too selfless', 'Too sensitive', 'Fluctuating self-esteem'],
    workStyle: 'Excel in people-focused roles with opportunities to inspire and develop others.'
  },
  'ENFP': {
    title: 'The Campaigner',
    description: 'Enthusiastic, creative and sociable free spirits.',
    traits: ['Enthusiastic', 'Creative', 'Sociable', 'Energetic', 'Independent'],
    strengths: ['Enthusiastic and energetic', 'Creative', 'People-focused', 'Excellent communication skills'],
    challenges: ['Poor practical skills', 'Find it difficult to focus', 'Overthink things', 'Get stressed easily'],
    workStyle: 'Prefer flexible, people-oriented environments with variety and opportunities for creativity.'
  },
  'ISTJ': {
    title: 'The Logistician',
    description: 'Practical and fact-minded, reliable and responsible.',
    traits: ['Honest', 'Direct', 'Strong-willed', 'Dutiful', 'Responsible'],
    strengths: ['Honest and direct', 'Strong-willed and dutiful', 'Very responsible', 'Calm and practical'],
    challenges: ['Stubborn', 'Insensitive', 'Always by the book', 'Judgmental'],
    workStyle: 'Excel in structured environments with clear procedures, deadlines, and established systems.'
  },
  'ISFJ': {
    title: 'The Protector',
    description: 'Warm-hearted and dedicated, always ready to protect loved ones.',
    traits: ['Supportive', 'Reliable', 'Patient', 'Imaginative', 'Observant'],
    strengths: ['Supportive', 'Reliable and patient', 'Imaginative and observant', 'Enthusiastic'],
    challenges: ['Too modest', 'Take things too personally', 'Repress their feelings', 'Overload themselves'],
    workStyle: 'Work best in supportive roles where they can help others in practical, tangible ways.'
  },
  'ESTJ': {
    title: 'The Executive',
    description: 'Excellent administrators, unsurpassed at managing things or people.',
    traits: ['Dedicated', 'Strong-willed', 'Direct', 'Honest', 'Loyal'],
    strengths: ['Dedicated', 'Strong-willed', 'Direct and honest', 'Loyal, patient and reliable'],
    challenges: ['Inflexible and stubborn', 'Uncomfortable with unconventional situations', 'Judgmental'],
    workStyle: 'Thrive in leadership roles with clear authority, established processes, and measurable results.'
  },
  'ESFJ': {
    title: 'The Consul',
    description: 'Extraordinarily caring, social and popular people, always eager to help.',
    traits: ['Strong practical skills', 'Loyal', 'Sensitive', 'Warm-hearted', 'Good at connecting'],
    strengths: ['Strong practical skills', 'Strong sense of duty', 'Very loyal', 'Sensitive and warm'],
    challenges: ['Worried about their social status', 'Inflexible', 'Reluctant to innovate', 'Vulnerable to criticism'],
    workStyle: 'Excel in people-focused environments where they can provide support and maintain harmony.'
  },
  'ISTP': {
    title: 'The Virtuoso',
    description: 'Bold and practical experimenters, masters of all kinds of tools.',
    traits: ['Tolerant', 'Flexible', 'Quiet', 'Reserved', 'Practical'],
    strengths: ['Optimistic and energetic', 'Creative and practical', 'Spontaneous and rational', 'Know how to prioritize'],
    challenges: ['Stubborn', 'Insensitive', 'Private and reserved', 'Easily bored'],
    workStyle: 'Prefer hands-on work with flexibility, independence, and practical problem-solving opportunities.'
  },
  'ISFP': {
    title: 'The Adventurer',
    description: 'Flexible and charming artists, always ready to explore new possibilities.',
    traits: ['Charming', 'Sensitive', 'Imaginative', 'Passionate', 'Curious'],
    strengths: ['Charming', 'Sensitive to others', 'Imaginative and artistic', 'Passionate'],
    challenges: ['Fiercely independent', 'Unpredictable', 'Easily stressed', 'Overly competitive'],
    workStyle: 'Thrive in creative, flexible environments that allow personal expression and align with values.'
  },
  'ESTP': {
    title: 'The Entrepreneur',
    description: 'Smart, energetic and perceptive people, truly enjoy living on the edge.',
    traits: ['Tolerant', 'Energetic', 'Creative', 'Perceptive', 'Spontaneous'],
    strengths: ['Tolerant and flexible', 'Original', 'Excellent people skills', 'Practical'],
    challenges: ['Sensitive', 'Conflict-averse', 'Easily bored', 'Poor long-term planning'],
    workStyle: 'Excel in dynamic, people-oriented environments with immediate results and variety.'
  },
  'ESFP': {
    title: 'The Entertainer',
    description: 'Spontaneous, energetic and enthusiastic people - life is never boring.',
    traits: ['Spontaneous', 'Energetic', 'Enthusiastic', 'People-focused', 'Warm'],
    strengths: ['Bold', 'Original', 'Aesthetics and showcase', 'Practical', 'Observant'],
    challenges: ['Sensitive', 'Conflict-averse', 'Easily bored', 'Poor long-term planning'],
    workStyle: 'Prefer people-centered environments with creativity, flexibility, and immediate feedback.'
  }
};

const MBTIQuiz: React.FC<MBTIQuizProps> = ({ onComplete, isRetake = false }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, 'A' | 'B'>>({});
  const [showResult, setShowResult] = useState(false);
  const [mbtiResult, setMbtiResult] = useState<MBTIResult | null>(null);
  const [careers, setCareers] = useState<Career[]>([]);
  const [courses, setCourses] = useState<CourseRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleAnswer = (answer: 'A' | 'B') => {
    setAnswers(prev => ({ ...prev, [currentQuestion]: answer }));
    
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const calculateResult = async () => {
    setLoading(true);
    
    const scores = {
      E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0
    };

    // Calculate scores based on answers
    questions.forEach((question, index) => {
      const answer = answers[index];
      if (answer === 'A') {
        scores[question.aValue]++;
      } else if (answer === 'B') {
        scores[question.bValue]++;
      }
    });

    // Determine MBTI type
    const type = 
      (scores.E > scores.I ? 'E' : 'I') +
      (scores.S > scores.N ? 'S' : 'N') +
      (scores.T > scores.F ? 'T' : 'F') +
      (scores.J > scores.P ? 'J' : 'P');

    const result: MBTIResult = { type, scores };
    setMbtiResult(result);

    // Save or update result to database
    if (user) {
      try {
        if (isRetake) {
          // Update existing result
          const { error: updateError } = await supabase
            .from('mbti_results')
            .update({
              mbti_type: type as MBTIType,
              extraversion_score: scores.E,
              sensing_score: scores.S,
              thinking_score: scores.T,
              judging_score: scores.J,
              completed_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating MBTI result:', updateError);
            toast({
              title: "Update Error",
              description: "Failed to update your test results. Please try again.",
              variant: "destructive"
            });
          } else {
            console.log('MBTI result updated successfully');
          }
        } else {
          // Insert new result
          const { error: insertError } = await supabase
            .from('mbti_results')
            .insert({
              user_id: user.id,
              mbti_type: type as MBTIType,
              extraversion_score: scores.E,
              sensing_score: scores.S,
              thinking_score: scores.T,
              judging_score: scores.J,
              completed_at: new Date().toISOString()
            });

          if (insertError) {
            console.error('Error saving MBTI result:', insertError);
            toast({
              title: "Save Error",
              description: "Failed to save your test results. Please try again.",
              variant: "destructive"
            });
          } else {
            console.log('MBTI result saved successfully');
          }
        }

        // Update profile to mark quiz as completed
        await supabase
          .from('profiles')
          .update({ 
            mbti_quiz_completed: true,
            show_mbti_reminder: false 
          })
          .eq('id', user.id);

      } catch (error) {
        console.error('Error saving result:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred. Please try again.",
          variant: "destructive"
        });
      }
    }

    // Fetch career and course recommendations
    await fetchRecommendations(type as MBTIType);
    
    setShowResult(true);
    setLoading(false);
    onComplete(result);
  };

  const fetchRecommendations = async (mbtiType: MBTIType) => {
    console.log('Fetching recommendations for MBTI type:', mbtiType);
    setLoadingRecommendations(true);
    
    try {
      // Fetch career recommendations from database
      const { data: careerData, error: careerError } = await supabase
        .from('career_recommendations')
        .select('career_title, description, industry')
        .eq('mbti_type', mbtiType);

      if (careerError) {
        console.error('Error fetching careers:', careerError);
        toast({
          title: "Warning",
          description: "Could not load career recommendations. Please refresh the page.",
          variant: "destructive"
        });
      } else {
        console.log('Career recommendations fetched:', careerData);
        setCareers(careerData || []);
      }

      // Fetch course recommendations from database
      const { data: courseData, error: courseError } = await supabase
        .from('course_recommendations')
        .select('skill_title, description, category')
        .eq('mbti_type', mbtiType);

      if (courseError) {
        console.error('Error fetching courses:', courseError);
        toast({
          title: "Warning",
          description: "Could not load course recommendations. Please refresh the page.",
          variant: "destructive"
        });
      } else {
        console.log('Course recommendations fetched:', courseData);
        setCourses(courseData || []);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: "Failed to load recommendations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const question = questions[currentQuestion];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kiki-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRetake ? 'Updating your personality analysis...' : 'Analyzing your personality...'}
          </p>
        </div>
      </div>
    );
  }

  if (showResult && mbtiResult) {
    const personalityInfo = PERSONALITY_DESCRIPTIONS[mbtiResult.type as keyof typeof PERSONALITY_DESCRIPTIONS];
    
    return (
      <div className="space-y-8">
        {/* Result Header */}
        <div className="text-center bg-gradient-to-r from-kiki-purple-50 to-kiki-blue-50 rounded-2xl p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-kiki-purple-500 to-kiki-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Brain className="text-white w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Personality Type</h2>
          <div className="text-6xl font-bold bg-gradient-to-r from-kiki-purple-600 to-kiki-blue-600 bg-clip-text text-transparent mb-2">
            {mbtiResult.type}
          </div>
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">{personalityInfo.title}</h3>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            {personalityInfo.description}
          </p>
          <p className="text-sm text-gray-500 mt-4">
            {isRetake 
              ? 'Your personality analysis has been updated with your latest responses.'
              : 'Based on your responses, here\'s your comprehensive personality profile.'
            }
          </p>
        </div>

        {/* Personality Details */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Traits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Key Traits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {personalityInfo.traits.map((trait, index) => (
                  <Badge key={index} variant="outline" className="bg-kiki-purple-50 text-kiki-purple-700 border-kiki-purple-200">
                    {trait}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Work Style */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                Work Style
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{personalityInfo.workStyle}</p>
            </CardContent>
          </Card>
        </div>

        {/* Strengths and Challenges */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-green-500" />
                Strengths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {personalityInfo.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-500" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {personalityInfo.challenges.map((challenge, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-gray-700">{challenge}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Score Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Your Personality Dimensions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                <span className="font-medium">Extraversion vs Introversion</span>
                <Badge variant="outline" className="font-semibold bg-white">
                  {mbtiResult.scores.E > mbtiResult.scores.I ? `E (${mbtiResult.scores.E}/12)` : `I (${mbtiResult.scores.I}/12)`}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                <span className="font-medium">Sensing vs Intuition</span>
                <Badge variant="outline" className="font-semibold bg-white">
                  {mbtiResult.scores.S > mbtiResult.scores.N ? `S (${mbtiResult.scores.S}/12)` : `N (${mbtiResult.scores.N}/12)`}
                </Badge>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                <span className="font-medium">Thinking vs Feeling</span>
                <Badge variant="outline" className="font-semibold bg-white">
                  {mbtiResult.scores.T > mbtiResult.scores.F ? `T (${mbtiResult.scores.T}/12)` : `F (${mbtiResult.scores.F}/12)`}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg">
                <span className="font-medium">Judging vs Perceiving</span>
                <Badge variant="outline" className="font-semibold bg-white">
                  {mbtiResult.scores.J > mbtiResult.scores.P ? `J (${mbtiResult.scores.J}/12)` : `P (${mbtiResult.scores.P}/12)`}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading Recommendations */}
        {loadingRecommendations && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-kiki-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your personalized recommendations...</p>
          </div>
        )}

        {/* Career Recommendations */}
        {!loadingRecommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Career Recommendations for {mbtiResult.type}
                <Badge variant="secondary" className="ml-2">{careers.length} found</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {careers.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {careers.map((career, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{career.career_title}</h3>
                          {career.industry && (
                            <Badge variant="outline" className="text-xs mb-2">{career.industry}</Badge>
                          )}
                        </div>
                      </div>
                      {career.description && (
                        <p className="text-sm text-gray-600 line-clamp-3">{career.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Career Recommendations Found</h3>
                  <p className="text-sm">We're continuously updating our database with more career recommendations for {mbtiResult.type} types.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Course Recommendations */}
        {!loadingRecommendations && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-green-600" />
                Skill Development Recommendations for {mbtiResult.type}
                <Badge variant="secondary" className="ml-2">{courses.length} found</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4">
                  {courses.map((course, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-green-50 hover:from-green-50 hover:to-green-100">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Lightbulb className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{course.skill_title}</h3>
                          {course.category && (
                            <Badge variant="outline" className="text-xs mb-2">{course.category}</Badge>
                          )}
                        </div>
                      </div>
                      {course.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Course Recommendations Found</h3>
                  <p className="text-sm">We're continuously updating our database with more skill recommendations for {mbtiResult.type} types.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl font-bold text-gray-900">
            {question.question}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAnswer('A')}
              className="p-6 h-auto text-left justify-start hover:bg-kiki-purple-50 hover:border-kiki-purple-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-kiki-purple-100 flex items-center justify-center text-kiki-purple-600 font-semibold">
                  A
                </div>
                <span className="text-base">{question.optionA}</span>
              </div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={() => handleAnswer('B')}
              className="p-6 h-auto text-left justify-start hover:bg-kiki-blue-50 hover:border-kiki-blue-300 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-kiki-blue-100 flex items-center justify-center text-kiki-blue-600 font-semibold">
                  B
                </div>
                <span className="text-base">{question.optionB}</span>
              </div>
            </Button>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <Button
              variant="ghost"
              onClick={goToPrevious}
              disabled={currentQuestion === 0}
            >
              ← Previous
            </Button>
            <div className="text-sm text-gray-500">
              {Object.keys(answers).length} of {questions.length} answered
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MBTIQuiz;
