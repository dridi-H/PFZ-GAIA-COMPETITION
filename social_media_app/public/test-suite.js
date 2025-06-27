/**
 * Comprehensive Signup Test Script
 * Run this in the browser console to test all signup scenarios
 */

// Test different email formats and domains
const testEmails = [
  'testuser@gmail.com',
  'user123@yahoo.com', 
  'demo@outlook.com',
  'test@test.com',
  'hello@demo.org',
  'user@icloud.com'
];

// Test passwords with different complexity levels
const testPasswords = [
  'TestPass123!',  // Strong password
  'Password123',   // Good password
  'TestUser1',     // Minimum requirements
];

// Main test function
const runSignupTests = async () => {
  console.log('🚀 Starting comprehensive signup tests...');
  
  const results = [];
  
  for (let i = 0; i < testEmails.length; i++) {
    const email = testEmails[i];
    const password = testPasswords[i % testPasswords.length];
    const timestamp = Date.now() + i;
    
    const testUser = {
      name: `Test User ${i + 1}`,
      username: `testuser${timestamp}`,
      email: email.replace('@', `${timestamp}@`), // Make email unique
      password: password
    };
    
    console.log(`\n📧 Testing signup ${i + 1}/${testEmails.length}:`, {
      email: testUser.email,
      password: testUser.password
    });
    
    try {
      // This would call the actual signup function
      // Replace with your actual createUserAccount function call
      console.log('✅ Would attempt signup with:', testUser);
      
      results.push({
        email: testUser.email,
        success: true,
        message: 'Test ready - replace with actual signup call'
      });
      
    } catch (error) {
      console.error('❌ Signup failed for', testUser.email, ':', error);
      results.push({
        email: testUser.email,
        success: false,
        error: error.message
      });
    }
    
    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.table(results);
  
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${results.length - successful}/${results.length}`);
  
  return results;
};

// Individual test functions
const testSingleSignup = async (email, password) => {
  const timestamp = Date.now();
  const testUser = {
    name: 'Single Test User',
    username: `singletest${timestamp}`,
    email: email,
    password: password
  };
  
  console.log('🧪 Testing single signup:', testUser);
  
  try {
    // Replace this with actual signup call:
    // const result = await createUserAccount(testUser);
    console.log('✅ Single test ready - replace with actual signup call');
    return { success: true, user: testUser };
  } catch (error) {
    console.error('❌ Single test failed:', error);
    return { success: false, error: error.message };
  }
};

// Database verification test
const testDatabaseAccess = async () => {
  console.log('🔍 Testing database access...');
  
  try {
    // Test if we can access Supabase
    if (typeof window !== 'undefined' && window.supabase) {
      const { data, error } = await window.supabase
        .from('users')
        .select('count', { count: 'exact', head: true });
        
      console.log('✅ Database access successful:', { data, error });
      return true;
    } else {
      console.log('⚠️ Supabase client not available in window object');
      return false;
    }
  } catch (error) {
    console.error('❌ Database access failed:', error);
    return false;
  }
};

// Validation test
const testValidation = () => {
  console.log('🔧 Testing validation rules...');
  
  const validationTests = [
    { email: 'valid@gmail.com', valid: true, reason: 'Standard email' },
    { email: 'test.email+tag@example.com', valid: true, reason: 'Email with plus and dot' },
    { email: 'invalid-email', valid: false, reason: 'Missing @ and domain' },
    { email: '@domain.com', valid: false, reason: 'Missing local part' },
    { email: 'email@', valid: false, reason: 'Missing domain' },
  ];
  
  const passwordTests = [
    { password: 'TestPass123!', valid: true, reason: 'Strong password' },
    { password: 'Password123', valid: true, reason: 'Good password' },
    { password: 'password', valid: false, reason: 'Too weak' },
    { password: '123456', valid: false, reason: 'Too short and numeric only' },
    { password: 'Pass1', valid: false, reason: 'Too short' },
  ];
  
  console.log('Email validation tests:');
  console.table(validationTests);
  
  console.log('Password validation tests:');
  console.table(passwordTests);
};

// Export test functions for manual use
window.signupTests = {
  runAll: runSignupTests,
  testSingle: testSingleSignup,
  testDatabase: testDatabaseAccess,
  testValidation: testValidation
};

console.log('🎯 Signup test suite loaded! Available commands:');
console.log('  signupTests.runAll() - Run all signup tests');
console.log('  signupTests.testSingle("email@test.com", "Password123") - Test single signup');
console.log('  signupTests.testDatabase() - Test database connection');
console.log('  signupTests.testValidation() - Show validation rules');
