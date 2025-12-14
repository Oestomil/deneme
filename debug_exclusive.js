
(async () => {
    // 1. Setup: Ensure week-1 is published
    console.log("Setting up Week 1 as Published...");
    await fetch('http://localhost:3000/api/admin/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dateKey: 'week-1',
            matchIds: ['1'], // Assuming ID 1 exists
            published: true,
            exclusive: false
        })
    });

    // 2. Publish Week 2 with exclusive = true
    console.log("Publishing Week 2 with Exclusive=true...");
    await fetch('http://localhost:3000/api/admin/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dateKey: 'week-2',
            matchIds: ['2'], // Assuming ID 2 exists
            published: true,
            exclusive: true
        })
    });

    // 3. Check results
    const check = async (key) => {
        const res = await fetch(`http://localhost:3000/api/public/daily?dateKey=${key}`);
        if (res.status === 404) return "UNPUBLISHED";
        return "PUBLISHED";
    };

    console.log("Result Week 1:", await check("week-1")); // Should be UNPUBLISHED
    console.log("Result Week 2:", await check("week-2")); // Should be PUBLISHED
})();
