"use client";

import { useState, useEffect } from "react";
import type { Match } from "@/lib/types";

export default function StatsPage() {
    const [week, setWeek] = useState(1);
    const [matches, setMatches] = useState<Match[]>([]);
    const [stats, setStats] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDailyStats();
    }, [week]);

    const fetchDailyStats = async () => {
        setLoading(true);
        try {
            const dateKey = `week-${week}`;

            const [dailyRes, statsRes] = await Promise.all([
                fetch(`/api/public/daily?dateKey=${dateKey}`),
                fetch(`/api/public/stats?dateKey=${dateKey}`)
            ]);

            const dailyData = await dailyRes.json();
            const statsData = await statsRes.json();

            setMatches(dailyData.matches || []);
            setStats(statsData.stats || {});
        } catch (error) {
            console.error("Failed to fetch stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const calculatePercent = (val: number | undefined, total: number) => {
        if (!total || !val) return 0;
        return Math.round((val / total) * 100);
    };

    return (
        <div className="px-4 sm:px-0">
            <h1 className="text-2xl font-semibold text-gray-900 mb-6">Match Statistics</h1>

            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Week
                </label>
                <select
                    value={week}
                    onChange={(e) => setWeek(parseInt(e.target.value))}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border w-48"
                >
                    {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                        <option key={w} value={w}>
                            Week {w}
                        </option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div>Loading stats...</div>
            ) : matches.length === 0 ? (
                <div className="text-gray-500">No matches found for this date.</div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {matches.map((match: any) => {
                        const matchStat = stats[match.id] || {};
                        const totalResult = Number(matchStat['1'] || 0) + Number(matchStat['X'] || 0) + Number(matchStat['2'] || 0);
                        const totalOU = Number(matchStat['over'] || 0) + Number(matchStat['under'] || 0);

                        return (
                            <div key={match.id} className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                                <div className="px-4 py-5 sm:p-6">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900 text-center mb-4">
                                        {match.homeTeam.shortName} vs {match.awayTeam.shortName}
                                    </h3>

                                    <div className="space-y-4">
                                        {/* Result Stats */}
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">Match Result ({totalResult} votes)</p>
                                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                                <div className="bg-green-100 p-2 rounded">
                                                    <div className="font-bold text-green-800">1</div>
                                                    <div>{calculatePercent(matchStat['1'], totalResult)}%</div>
                                                    <div className="text-xs text-gray-500">({matchStat['1'] || 0})</div>
                                                </div>
                                                <div className="bg-yellow-100 p-2 rounded">
                                                    <div className="font-bold text-yellow-800">X</div>
                                                    <div>{calculatePercent(matchStat['X'], totalResult)}%</div>
                                                    <div className="text-xs text-gray-500">({matchStat['X'] || 0})</div>
                                                </div>
                                                <div className="bg-red-100 p-2 rounded">
                                                    <div className="font-bold text-red-800">2</div>
                                                    <div>{calculatePercent(matchStat['2'], totalResult)}%</div>
                                                    <div className="text-xs text-gray-500">({matchStat['2'] || 0})</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* OU Stats */}
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-2">Over/Under 2.5 ({totalOU} votes)</p>
                                            <div className="grid grid-cols-2 gap-2 text-center text-sm">
                                                <div className="bg-blue-100 p-2 rounded">
                                                    <div className="font-bold text-blue-800">Under</div>
                                                    <div>{calculatePercent(matchStat['under'], totalOU)}%</div>
                                                    <div className="text-xs text-gray-500">({matchStat['under'] || 0})</div>
                                                </div>
                                                <div className="bg-purple-100 p-2 rounded">
                                                    <div className="font-bold text-purple-800">Over</div>
                                                    <div>{calculatePercent(matchStat['over'], totalOU)}%</div>
                                                    <div className="text-xs text-gray-500">({matchStat['over'] || 0})</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
