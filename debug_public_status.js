
(async () => {
    const check = async (key) => {
        try {
            const res = await fetch(`http://localhost:3000/api/public/daily?dateKey=${key}`);
            if (res.status === 404) return "Not Published / Not Found";
            const data = await res.json();
            return "Published";
        } catch (e) {
            return "Error";
        }
    };

    console.log("Week 1:", await check("week-1"));
    console.log("Week 2:", await check("week-2"));
})();
