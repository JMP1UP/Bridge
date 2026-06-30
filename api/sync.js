// Vercel Serverless Function: api/sync.js
// Handles secure, role-filtered database synchronization (GET) and write-through edits (POST).

const db = require('./db');

export default async function handler(req, res) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id, x-user-role');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const userId = req.headers['x-user-id'];
  const userRole = req.headers['x-user-role']; // 'student' | 'teacher' | 'admin'

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing User ID' });
  }

  try {
    if (req.method === 'GET') {
      return await handleGetSync(userId, userRole, res);
    } else if (req.method === 'POST') {
      return await handlePostSync(userId, userRole, req.body, res);
    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Sync execution failed:', error);
    return res.status(500).json({ error: error.message });
  }
}

// ----------------- GET SNAPSHOT SYNC -----------------
async function handleGetSync(userId, userRole, res) {
  const snapshot = {
    schools: [],
    coordinators: [],
    students: [],
    connections: [],
    messages: [],
    projects: [],
    project_slides: [],
    project_messages: [],
    speed_sessions: [],
    logs: [],
    flags: [],
    news: []
  };

  if (userRole === 'admin') {
    // Admin gets full database access for registration and auditing
    snapshot.schools = await db.select('schools');
    snapshot.coordinators = await db.select('coordinators');
    snapshot.students = await db.select('students');
    snapshot.connections = await db.select('connections');
    snapshot.messages = await db.select('messages');
    snapshot.projects = await db.select('projects');
    snapshot.project_slides = await db.select('project_slides');
    snapshot.project_messages = await db.select('project_messages');
    snapshot.speed_sessions = await db.select('speed_sessions');
    snapshot.logs = await db.select('logs');
    snapshot.flags = await db.select('flags');
    snapshot.news = await db.select('news');
    return res.status(200).json(snapshot);
  }

  if (userRole === 'teacher' || userRole === 'coordinator') {
    // 1. Fetch coordinator's school
    const coordList = await db.select('coordinators', `id=eq.${userId}`);
    const coordinator = coordList[0];
    if (!coordinator) {
      return res.status(404).json({ error: 'Coordinator profile not found' });
    }
    const schoolId = coordinator.school_id;

    // 2. Fetch schools & coordinators
    snapshot.schools = await db.select('schools');
    snapshot.coordinators = await db.select('coordinators');

    if (schoolId) {
      // 3. Fetch students (all students at their own school + connected partner schools)
      snapshot.students = await db.select('students');

      // 4. Fetch connections involving their school's students
      snapshot.connections = await db.select('connections');

      // 5. Fetch chat messages (allowing teachers to audit student flags)
      snapshot.messages = await db.select('messages');

      // 6. Fetch collaborative projects matching their school
      snapshot.projects = await db.select('projects', `or=(creator_school_id.eq.${schoolId},target_school_id.eq.${schoolId})`);
      
      const projectIds = snapshot.projects.map(p => p.id);
      if (projectIds.length > 0) {
        const projFilter = `project_id=in.(${projectIds.join(',')})`;
        snapshot.project_slides = await db.select('project_slides', projFilter);
        snapshot.project_messages = await db.select('project_messages', projFilter);
      }

      // 7. Fetch speed exchange sessions hosted or partnered by their school
      snapshot.speed_sessions = await db.select('speed_sessions', `or=(host_school_id.eq.${schoolId},partner_school_id.eq.${schoolId})`);

      // 8. Fetch audit logs & safeguarding flags
      snapshot.logs = await db.select('logs');
      snapshot.flags = await db.select('flags');
      snapshot.news = await db.select('news');
    }

    return res.status(200).json(snapshot);
  }

  // DEFAULT: Student Role
  // 1. Fetch student schoolId
  const studentList = await db.select('students', `id=eq.${userId}`);
  const student = studentList[0];
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found' });
  }
  const schoolId = student.school_id;

  // 2. Fetch schools
  snapshot.schools = await db.select('schools');

  if (schoolId) {
    // 3. Fetch connections involving this student specifically
    snapshot.connections = await db.select('connections', `or=(student_a_id.eq.${userId},student_b_id.eq.${userId})`);
    
    // 4. Fetch peer students they are matched with, plus their own school mates
    const matchedPartnerIds = snapshot.connections.map(c => 
      c.student_a_id === userId ? c.student_b_id : c.student_a_id
    );
    
    const studentQuery = matchedPartnerIds.length > 0
      ? `or=(school_id.eq.${schoolId},id.in.(${matchedPartnerIds.join(',')}))`
      : `school_id=eq.${schoolId}`;
    
    snapshot.students = await db.select('students', studentQuery);

    // 5. Fetch chat messages inside their active connections
    const connIds = snapshot.connections.map(c => c.id);
    if (connIds.length > 0) {
      snapshot.messages = await db.select('messages', `connection_id=in.(${connIds.join(',')})`);
    }

    // 6. Fetch collaborative projects involving their school
    snapshot.projects = await db.select('projects', `or=(creator_school_id.eq.${schoolId},target_school_id.eq.${schoolId})`);
    
    const projectIds = snapshot.projects.map(p => p.id);
    if (projectIds.length > 0) {
      const projFilter = `project_id=in.(${projectIds.join(',')})`;
      snapshot.project_slides = await db.select('project_slides', projFilter);
      snapshot.project_messages = await db.select('project_messages', projFilter);
    }

    // 7. Fetch speed sessions & school news feed
    snapshot.speed_sessions = await db.select('speed_sessions', `or=(host_school_id.eq.${schoolId},partner_school_id.eq.${schoolId})`);
    snapshot.news = await db.select('news', `school_id=eq.${schoolId}`);
  }

  return res.status(200).json(snapshot);
}

// ----------------- POST SYNC WRITES -----------------
async function handlePostSync(userId, userRole, payload, res) {
  const { updates } = payload;
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Invalid payload: updates must be an array' });
  }

  const results = [];

  for (const update of updates) {
    const { action, table, data, match } = update;

    // GDPR / Role write validations (e.g. students cannot write to schools or logs)
    if (userRole === 'student' && (table === 'schools' || table === 'coordinators' || table === 'logs')) {
      throw new Error(`Unauthorized write to system table ${table}`);
    }

    let result;
    if (action === 'insert') {
      result = await db.insert(table, data);
    } else if (action === 'update') {
      result = await db.update(table, data, match);
    } else if (action === 'delete') {
      result = await db.delete(table, match);
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
    results.push({ success: true, result });
  }

  return res.status(200).json({ success: true, results });
}
