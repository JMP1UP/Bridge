// DB helper wrapping Supabase PostgREST API queries into simple promise-based REST helpers
// This avoids importing heavy pg drivers and minimizes Vercel cold-start times.

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key bypasses RLS for backend API logic

async function request(path, options = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Supabase environment variables are not configured');
  }

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${path}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errText = await response.text();
    let errJson;
    try { errJson = JSON.parse(errText); } catch (e) {}
    throw new Error(errJson?.message || errJson?.details || errText || `HTTP Error ${response.status}`);
  }

  // HTTP 204 No Content returned for deletes / empty updates
  if (response.status === 204) return null;

  return await response.json();
}

const db = {
  // Select rows: db.select('students', 'select=*&active=eq.true')
  async select(table, queryString = 'select=*') {
    const separator = queryString.includes('select=') ? '' : 'select=*&';
    return await request(`${table}?${separator}${queryString}`, {
      method: 'GET'
    });
  },

  // Insert row: db.insert('messages', { sender_id: '...', text: '...' })
  async insert(table, data) {
    const result = await request(table, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return Array.isArray(result) ? result[0] : result;
  },

  // Update rows: db.update('students', { active: false }, 'id=eq.uuid-here')
  async update(table, data, matchQueryString) {
    if (!matchQueryString) throw new Error('Update queries require a match constraint');
    return await request(`${table}?${matchQueryString}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },

  // Delete rows: db.delete('connections', 'id=eq.uuid-here')
  async delete(table, matchQueryString) {
    if (!matchQueryString) throw new Error('Delete queries require a match constraint');
    return await request(`${table}?${matchQueryString}`, {
      method: 'DELETE'
    });
  },

  // Trigger PostgreSQL RPC functions in Supabase: db.rpc('match_students', { age_range: 2 })
  async rpc(functionName, args = {}) {
    return await request(`rpc/${functionName}`, {
      method: 'POST',
      body: JSON.stringify(args)
    });
  }
};

module.exports = db;
