
(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/admin/daily');
        const data = await res.json();
        console.log('All Daily Sets:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
})();
