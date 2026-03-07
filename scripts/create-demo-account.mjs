#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvuslmfjkkuizixjpkgl.supabase.co';
// Use service role key for admin operations (bypasses RLS)
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12dXNsbWZqa2t1aXppeGpwa2dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NzYyMDksImV4cCI6MjA4NTA1MjIwOX0.N2KDxKd_9cJNDS7B9szyA3Gkz8a-WrH14jfRciwrAX0';

// Use service key if available, otherwise anon
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

const DEMO_EMAIL = 'demo@conduitai.io';
const DEMO_PASSWORD = 'ConduitDemo2026!';

async function main() {
  console.log('🚀 Creating demo account for Apple review...\n');

  // 1. Create auth user
  console.log('1. Creating auth user...');
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
    options: {
      data: {
        owner_name: 'Demo User',
        business_name: 'Demo Barbershop',
        phone: '+15615550100',
        plan: 'demo',
        onboarding_complete: true,
        greeting_message: "Hi, thanks for calling Demo Barbershop! I'm your AI assistant. How can I help you today?",
      },
    },
  });

  if (authError) {
    // If user exists, try to sign in
    if (authError.message.includes('already registered')) {
      console.log('   User already exists, signing in...');
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      });
      if (signInError) {
        console.error('   ❌ Sign in failed:', signInError.message);
        process.exit(1);
      }
      authData.user = signInData.user;
      authData.session = signInData.session;
    } else {
      console.error('   ❌ Auth error:', authError.message);
      process.exit(1);
    }
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('   ❌ No user ID returned');
    process.exit(1);
  }
  console.log(`   ✅ User ID: ${userId}`);

  // 2. Check if client record exists, if not create one
  console.log('\n2. Setting up client record...');
  let { data: existingClient } = await supabase
    .from('clients')
    .select('id')
    .eq('user_id', userId)
    .single();

  let clientId;
  if (existingClient) {
    clientId = existingClient.id;
    console.log(`   ✅ Client already exists: ${clientId}`);
  } else {
    // Try minimal insert - user_id + business_name required
    const { data: newClient, error: clientError } = await supabase
      .from('clients')
      .insert({ user_id: userId, business_name: 'Demo Barbershop' })
      .select()
      .single();

    if (clientError) {
      console.error('   ❌ Client creation failed:', clientError.message);
      console.log('   Trying to fetch existing client anyway...');
    } else {
      clientId = newClient.id;
      console.log(`   ✅ Client created: ${clientId}`);
      
      // Try to update with optional fields (ignore errors)
      await supabase
        .from('clients')
        .update({ avg_job_value: 35, revenue_recovered: 1245 })
        .eq('id', clientId);
    }
  }

  if (!clientId) {
    // Fetch again
    const { data: refetch } = await supabase
      .from('clients')
      .select('id')
      .eq('user_id', userId)
      .single();
    clientId = refetch?.id;
  }

  if (!clientId) {
    console.error('   ❌ Could not get client ID');
    process.exit(1);
  }

  // 3. Check if demo calls exist, if not add sample leads
  console.log('\n3. Adding sample leads...');
  const { count } = await supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  if (count && count > 0) {
    console.log(`   ⏭️  ${count} leads already exist, skipping...`);
  } else {
    const now = new Date();
    const sampleCalls = [
      {
        client_id: clientId,
        caller_name: 'Michael Johnson',
        caller_phone: '+15615551234',
        transcript_summary: 'Looking for a haircut and beard trim this Saturday afternoon. Prefers a fade on the sides.',
        status: 'new',
        created_at: new Date(now - 1000 * 60 * 30).toISOString(), // 30 min ago
      },
      {
        client_id: clientId,
        caller_name: 'David Martinez',
        caller_phone: '+15615555678',
        transcript_summary: 'Wants to schedule a haircut for his 8-year-old son. Asked about prices for kids cuts.',
        status: 'contacted',
        created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      },
      {
        client_id: clientId,
        caller_name: 'James Wilson',
        caller_phone: '+15615559012',
        transcript_summary: 'Regular customer checking availability for his usual Thursday 5pm slot. Confirmed booking.',
        status: 'converted',
        created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
      },
      {
        client_id: clientId,
        caller_name: 'Robert Brown',
        caller_phone: '+15615553456',
        transcript_summary: 'Interested in the hot towel shave service. Asked about duration and price. Wants to book for Friday morning.',
        status: 'new',
        created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      },
      {
        client_id: clientId,
        caller_name: 'Christopher Lee',
        caller_phone: '+15615557890',
        transcript_summary: 'Walk-in availability check. Decided to come in tomorrow morning instead.',
        status: 'contacted',
        created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      },
      {
        client_id: clientId,
        caller_name: 'Anthony Garcia',
        caller_phone: '+15615552345',
        transcript_summary: 'Asking about hair coloring services. Wants to cover some gray. Booked consultation for next week.',
        status: 'converted',
        created_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
      },
    ];

    const { error: callsError } = await supabase.from('calls').insert(sampleCalls);

    if (callsError) {
      console.error('   ❌ Failed to insert calls:', callsError.message);
    } else {
      console.log(`   ✅ Added ${sampleCalls.length} sample leads`);
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('✅ DEMO ACCOUNT READY');
  console.log('═'.repeat(50));
  console.log(`Email:    ${DEMO_EMAIL}`);
  console.log(`Password: ${DEMO_PASSWORD}`);
  console.log('═'.repeat(50));
}

main().catch(console.error);
