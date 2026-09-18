import { createClient } from '@supabase/supabase-js'

const url = 'https://xkakoecfzeiednklsrqd.supabase.co'
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYWtvZWNmemVpZWRua2xzcnFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyOTQwODksImV4cCI6MjEwNDg3MDA4OX0.3QzxNvy2Ag2okM_bJmVlewyHa6fy9ZTCYJ2If2Iw6u0'

async function login(email, password) {
  const supa = createClient(url, anon)
  const { data, error } = await supa.auth.signInWithPassword({ email, password })
  if (error) throw error
  return { supa, user: data.user, token: data.session.access_token }
}

async function run() {
  console.log('=== SECURITY MATRIX ===')
  const adminA = await login('sec_a@lkbb.local', 'SecA123!')
  const adminB = await login('sec_b@lkbb.local', 'SecB123!')
  const superAdmin = await login('rezzanurbaitulloh@gmail.com', 'rezzanur')
  console.log('Logged in', adminA.user.id, adminB.user.id, superAdmin.user.id)

  // Test 1: Admin A tries to insert peleton into Event B (should fail RLS)
  const test1 = await adminA.supa.from('peletons').insert({
    slug: 'sec-test-cross-'+Date.now(),
    number: '99',
    name: 'CROSS EVENT TEST',
    school: 'TEST',
    city: 'Test',
    province: 'Jatim',
    category: 'SMA',
    verified: true,
    active: true,
    event_id: '3c8736b3-fb5f-4928-a519-d0abcecb1bd9' // Event B
  }).select()
  console.log('Test1 Admin A -> Event B insert:', test1.error ? `DENY OK (${test1.error.message.slice(0,80)})` : 'FAIL - should be DENY but got', test1.data?.length)

  // Test 2: Admin B tries to insert into Event A (should fail)
  const test2 = await adminB.supa.from('peletons').insert({
    slug: 'sec-test-cross2-'+Date.now(),
    number: '98',
    name: 'CROSS 2',
    school: 'TEST',
    city: 'Test',
    province: 'Jatim',
    category: 'SMP',
    verified: true,
    active: true,
    event_id: 'd3397f65-91bb-43fe-8cfb-206e555e6f5c'
  }).select()
  console.log('Test2 Admin B -> Event A insert:', test2.error ? `DENY OK (${test2.error.message.slice(0,80)})` : 'FAIL')

  // Test 3: Super admin insert into Event B should succeed
  const test3 = await superAdmin.supa.from('peletons').insert({
    slug: 'sec-test-super-'+Date.now(),
    number: '97',
    name: 'SUPER OK',
    school: 'TEST',
    city: 'Test',
    province: 'Jatim',
    category: 'SMA',
    verified: true,
    active: true,
    event_id: '3c8736b3-fb5f-4928-a519-d0abcecb1bd9'
  }).select()
  console.log('Test3 Super -> Event B insert:', test3.error ? `FAIL ${test3.error.message}` : `ALLOW OK id=${test3.data[0].id}`)
  if (test3.data) await superAdmin.supa.from('peletons').delete().eq('id', test3.data[0].id)

  // Test 4: Admin A tries to read transactions of Event B via event_id filter (should be able via RLS? But API should deny, direct DB via RLS for transactions: is_event_admin check)
  // For transactions, Admin A should not see Event B transactions via RLS? Let's check
  const { data: txB, error: txErr } = await adminA.supa.from('transactions').select('id,event_id').eq('event_id','3c8736b3-fb5f-4928-a519-d0abcecb1bd9').limit(1)
  console.log('Test4 Admin A read Event B transactions:', txErr ? `ERR ${txErr.message.slice(0,60)}` : `got ${txB.length} rows (expected 0 for isolation, but public read may allow)`)
  if (txB.length>0) console.log('  -> RLS allows read, but API should deny via event check (see API test)')

  // Test 5: Try to modify platform_roles as Admin A (should fail)
  const test5 = await adminA.supa.from('platform_roles').insert({ user_id: adminA.user.id, role: 'SUPER_ADMIN' }).select()
  console.log('Test5 Admin A create SUPER_ADMIN:', test5.error ? `DENY OK (${test5.error.message.slice(0,80)})` : 'FAIL - should be DENY')

  // Test 6: Super admin can read platform_roles
  const { data: pr, error: prErr } = await superAdmin.supa.from('platform_roles').select('*')
  console.log('Test6 Super read platform_roles:', prErr ? `FAIL ${prErr.message}` : `ALLOW OK count=${pr.length}`)

  // Test 7: Check event_members isolation: Admin A should not be able to update Event B member
  const { error: updErr } = await adminA.supa.from('event_members').update({ role: 'USER' }).eq('event_id','3c8736b3-fb5f-4928-a519-d0abcecb1bd9').eq('user_id','d123423f-5159-4996-859e-f5819fb50c6e')
  console.log('Test7 Admin A update Event B member:', updErr ? `DENY OK (${updErr.message.slice(0,80)})` : 'FAIL - should be DENY or 0 rows')

  console.log('=== DONE ===')
}

run().catch(e=>{console.error(e); process.exit(1)})
