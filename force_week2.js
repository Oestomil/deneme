
(async () => {
    console.log("Forcing Week 2 to be ACTIVE...");
    // 1. Unpublish Week 1
    await fetch('http://localhost:3000/api/admin/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dateKey: 'week-1',
            matchIds: ['1'], // dummy but necessary
            published: false
        })
    });

    // 2. Publish Week 2
    await fetch('http://localhost:3000/api/admin/daily', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            dateKey: 'week-2',
            matchIds: ['2'], // dummy but necessary, hopefully user has match 2
            published: true
        })
    });

    console.log("DONE. Week 2 should be active now.");
})();
