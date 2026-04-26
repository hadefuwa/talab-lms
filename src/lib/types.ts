export type Role = "founder" | "parent" | "student";

export interface Organization {
  id: string;
  name: string;
  subscription_status: "active" | "inactive" | "trialing";
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  org_id: string | null;
  role: Role;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string | null;
  subject_category: string;
  is_published: boolean;
  is_free: boolean;
  key_stage: "nursery" | "ks1" | "ks2";
  thumbnail_key: string | null;
  created_at: string;
  lessonCount?: number;
  quizCount?: number;
  completedCount?: number;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  r2_key: string | null;
  content_body: string | null;
  position: number;
  duration_seconds: number | null;
  lesson_type: "content" | "video" | "game" | "interactive";
  content_path: string | null;
  game_path: string | null;
  game_pass_score: number | null;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  student_id: string;
  lesson_id: string;
  org_id: string;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
  game_score: number | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  pass_score: number;
  is_published: boolean;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string | null;
  position: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  org_id: string | null;
  score: number;
  max_score: number;
  passed: boolean;
  answers: number[];
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: Organization;
        Insert: Omit<Organization, "id" | "created_at">;
        Update: Partial<Omit<Organization, "id" | "created_at">>;
      };
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at">;
        Update: Partial<Omit<Profile, "id" | "created_at">>;
      };
      courses: {
        Row: Course;
        Insert: Omit<Course, "id" | "created_at">;
        Update: Partial<Omit<Course, "id" | "created_at">>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, "id" | "created_at">;
        Update: Partial<Omit<Lesson, "id" | "created_at">>;
      };
      progress_logs: {
        Row: ProgressLog;
        Insert: Omit<ProgressLog, "id" | "created_at">;
        Update: Partial<Omit<ProgressLog, "id" | "created_at">>;
      };
    };
  };
}
