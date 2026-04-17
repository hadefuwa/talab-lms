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
  thumbnail_key: string | null;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  r2_key: string | null;
  content_body: string | null;
  position: number;
  duration_seconds: number | null;
  created_at: string;
}

export interface ProgressLog {
  id: string;
  student_id: string;
  lesson_id: string;
  org_id: string;
  status: "not_started" | "in_progress" | "completed";
  completed_at: string | null;
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
