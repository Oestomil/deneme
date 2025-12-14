"use client";

import { useState, useEffect } from "react";
import type { Match, DailySet } from "@/lib/types";

export default function WeeklyPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [week, setWeek] = useState(1);
    const [selectedMatchIds, setSelectedMatchIds] = useState<string[]>([]);
    const [published, setPublished] = useState(true);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        fetchWeeklySet();
    }, [week]);

    const fetchData = async () => {
        try {
            const res = await fetch("/api/admin/matches");
            const data = await res.json();
            setMatches(data.matches || []);
        } catch (error) {
            console.error("Failed to fetch matches:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchWeeklySet = async () => {
        try {
            // Using week-{n} as the key
            const dateKey = `week-${week}`;
            const res = await fetch(`/api/admin/daily?dateKey=${dateKey}`);
            const data = await res.json();

            if (data.dailySet) {
                setSelectedMatchIds(data.dailySet.matchIds);
                setPublished(data.dailySet.published);
            } else {
                // Check if we can auto-populate with matches assigned to this week?
                // For now, start empty or maybe auto-select matches with this week ID?
                // Let's auto-select matches that belong to this week
                // BUT we need to wait for matches to be loaded.
                // Actually, filtering happens in render.
                setSelectedMatchIds([]);
                setPublished(false);
            }
        } catch (error) {
            console.error("Failed to fetch weekly set:", error);
        }
    };

    const handleToggleMatch = (matchId: string) => {
        if (selectedMatchIds.includes(matchId)) {
            setSelectedMatchIds(selectedMatchIds.filter((id) => id !== matchId));
        } else {
            setSelectedMatchIds([...selectedMatchIds, matchId]);
        }
    };

    const handleSave = async (exclusive: boolean = false, forcePublish?: boolean) => {
        if (selectedMatchIds.length === 0) {
            alert("Please select at least 1 match");
            return;
        }

        const isPublished = forcePublish ?? published;
        const dateKey = `week-${week}`;

        try {
            const res = await fetch("/api/admin/daily", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dateKey,
                    matchIds: selectedMatchIds,
                    published: isPublished,
                    exclusive,
                }),
            });

            if (res.ok) {
                // Update local state to match
                setPublished(isPublished);
                alert(`Week ${week} saved${exclusive ? ' and set as ACTIVE' : ''}!`);
            } else {
                alert("Failed to save weekly set");
            }
        } catch (error) {
            alert("An error occurred");
        }
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    // STRICT FILTERING: Only show matches that belong to the selected week
    const weekMatches = matches.filter(
        (m) => (m.week || 1) === week
    );

    return (
        <div className="px-4 sm:px-0">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Weekly Sets</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Create sets for each week. Matches must be assigned to the week in the "Matches" page first.
                    </p>
                </div>
            </div>

            <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Week
                        </label>
                        <select
                            value={week}
                            onChange={(e) => setWeek(parseInt(e.target.value))}
                            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border w-full"
                        >
                            {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
                                <option key={w} value={w}>
                                    Week {w}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={published}
                                onChange={(e) => setPublished(e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">
                                Publish (make visible to mobile app)
                            </span>
                        </label>
                    </div>

                    <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-3">
                            Matches Available for Week {week}: {weekMatches.length}
                        </p>

                        {weekMatches.length === 0 ? (
                            <div className="text-gray-500 text-sm italic">
                                No matches assigned to Week {week}. Go to the Matches page and edit matches to assign them to this week.
                            </div>
                        ) : (
                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                {weekMatches.map((match) => {
                                    const isSelected = selectedMatchIds.includes(match.id);
                                    const selectionIndex = selectedMatchIds.indexOf(match.id);

                                    return (
                                        <div
                                            key={match.id}
                                            onClick={() => handleToggleMatch(match.id)}
                                            className={`p-3 rounded-md border cursor-pointer transition-colors ${isSelected
                                                ? "bg-blue-50 border-blue-500"
                                                : "bg-white border-gray-200 hover:bg-gray-50"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {match.homeTeamId} vs {match.awayTeamId}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {match.league} •{" "}
                                                        {new Date(match.kickoffAt).toLocaleString()}
                                                    </p>
                                                </div>
                                                {isSelected && (
                                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold">
                                                        {selectionIndex + 1}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="border-t pt-4 flex gap-4">
                        <button
                            onClick={() => handleSave(false)}
                            disabled={selectedMatchIds.length === 0}
                            className="flex-1 rounded-md bg-white border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                            Save Draft
                        </button>
                        <button
                            onClick={() => handleSave(true, true)}
                            disabled={selectedMatchIds.length === 0}
                            className="flex-1 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            🚀 PUBLISH / SET ACTIVE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
