async function testApis() {
    try {
        const loginRes = await fetch('http://localhost:4004/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'diet@foodiedash.vn',
                password: 'Customer@123'
            })
        });
        
        const cookies = loginRes.headers.get('set-cookie');
        if (!cookies) throw new Error("No cookies returned from login");

        console.log("Login Success! Cookies received.");

        console.log("Testing Safe Foods API...");
        const safeRes = await fetch('http://localhost:4004/api/products/safe-foods', {
            headers: { 'Cookie': cookies }
        });
        const safeData = await safeRes.json();
        console.log("Safe Foods Status:", safeRes.status);
        console.log("Safe Foods Count:", safeData.data?.length);
        console.log("Safe Foods AI Insight Example:", safeData.data?.[0]?.aiReason?.substring(0, 50));

        console.log("\nTesting Recommendations API...");
        const recsRes = await fetch('http://localhost:4004/api/products/recommendations', {
            headers: { 'Cookie': cookies }
        });
        const recsData = await recsRes.json();
        console.log("Recommendations Status:", recsRes.status);
        console.log("Recommendations Count:", recsData.data?.length);

    } catch (error: any) {
        console.error("Error:", error.message);
    }
}

testApis();
