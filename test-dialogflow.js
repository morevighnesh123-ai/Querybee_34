// Test Dialogflow API to identify the exact error
const testDialogflow = async () => {
  try {
    console.log('Testing Dialogflow API...');
    
    // Test 1: Simple admission query
    console.log('\n=== Test 1: "admission" ===');
    const response1 = await fetch('https://query-bee-mauve.vercel.app/api/dialogflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'admission', 
        sessionId: 'test-1' 
      })
    });
    const result1 = await response1.json();
    console.log('Response:', result1);
    
    // Test 2: Followup query
    console.log('\n=== Test 2: "followup" ===');
    const response2 = await fetch('https://query-bee-mauve.vercel.app/api/dialogflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'followup', 
        sessionId: 'test-1' 
      })
    });
    const result2 = await response2.json();
    console.log('Response:', result2);
    
    // Test 3: Admission begin query
    console.log('\n=== Test 3: "admission begin" ===');
    const response3 = await fetch('https://query-bee-mauve.vercel.app/api/dialogflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        query: 'admission begin', 
        sessionId: 'test-2' 
      })
    });
    const result3 = await response3.json();
    console.log('Response:', result3);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
};

testDialogflow();
