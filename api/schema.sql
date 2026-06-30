-- Bridge PostgreSQL Database Schema Creation Script

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Schools Table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Coordinators (Teachers / Admin Staff)
CREATE TABLE coordinators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'Coordinator' CHECK (role IN ('Coordinator', 'Admin')) NOT NULL,
  approved BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Students
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  year_group VARCHAR(50) NOT NULL,
  gender VARCHAR(50) NOT NULL,
  interests TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
  bio TEXT,
  active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Student Connections (1-to-1 Matches)
CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_a_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  student_b_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Paused', 'Disbanded')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_student_pair UNIQUE(student_a_id, student_b_id)
);

-- 5. Chat Messages (1-to-1 Chat logs)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  translation TEXT,
  flagged BOOLEAN DEFAULT FALSE NOT NULL,
  flag_reason TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 6. Collaborative Group Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  target_school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Proposed', 'PendingPublish', 'Published')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  brief TEXT NOT NULL,
  paused BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 7. Collaborative Project Slides
CREATE TABLE project_slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  slide_index INT NOT NULL,
  layout VARCHAR(50) DEFAULT 'split' CHECK (layout IN ('split', 'text-only')) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  photo_url TEXT,
  author VARCHAR(255) NOT NULL,
  editable_by_others BOOLEAN DEFAULT TRUE NOT NULL,
  last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT unique_project_slide_index UNIQUE(project_id, slide_index)
);

-- 8. Project Group Chat Messages
CREATE TABLE project_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 9. Speed Exchange Live Sessions
CREATE TABLE speed_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  partner_school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'lobby' CHECK (status IN ('lobby', 'active', 'ended')) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 10. Audit logs (GDPR & Safeguarding Auditing)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(100) NOT NULL,
  action TEXT NOT NULL,
  actor VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
