
(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/public/daily?dateKey=latest');
        const data = await res.json();
        console.log('Latest Data:', JSON.stringify(data, null, 2));

        const res2 = await fetch('http://localhost:3000/api/public/daily?dateKey=week-2');
        const data2 = await res2.json();
        console.log('Week 2 Data:', JSON.stringify(data2, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
