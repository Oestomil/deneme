"use client";

import { useState, useEffect } from "react";
import type { Match, Team } from "@/lib/types";

export default function MatchesPage() {
    const [matches, setMatches] = useState<Match[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const [formData, setFormData] = useState({
        id: "",
        homeTeamId: "",
        awayTeamId: "",
        league: "",
        kickoffAt: "",
        status: "draft" as "draft" | "published" | "archived",
        aiText: "",
        stadium: "",
        week: 1,
    });

    // Generator state
    const [showGenerator, setShowGenerator] = useState(false);
    const [genWeek, setGenWeek] = useState(1);
    const [genCount, setGenCount] = useState(5);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [matchesRes, teamsRes] = await Promise.all([
                fetch("/api/admin/matches"),
                fetch("/api/admin/teams"),
            ]);

            const matchesData = await matchesRes.json();
            const teamsData = await teamsRes.json();

            setMatches(matchesData.matches || []);
            setTeams(teamsData.teams || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Generate ID if new
        // const matchId = formData.id || `match-${Date.now()}`;
        // Let backend generate ID
        const matchId = formData.id;

        try {
            const res = await fetch("/api/admin/matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    match: {
                        ...formData,
                        id: matchId,
                        aiText: formData.aiText || null,
                    },
                }),
            });

            if (res.ok) {
                setShowForm(false);
                setFormData({
                    id: "",
                    homeTeamId: "",
                    awayTeamId: "",
                    league: "",
                    kickoffAt: "",
                    status: "draft",
                    aiText: "",
                    stadium: "",
                    week: 1,
                });
                fetchData();
            } else {
                alert("Failed to save match");
            }
        } catch (error) {
            alert("An error occurred");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this match?")) return;

        try {
            await fetch("/api/admin/matches", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", id }),
            });
            fetchData();
        } catch (error) {
            alert("Failed to delete match");
        }
    };

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch("/api/admin/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ week: genWeek, count: genCount }),
            });
            if (res.ok) {
                alert("Matches generated!");
                setShowGenerator(false);
                fetchData();
            } else {
                alert("Failed to generate");
            }
        } catch (error) {
            alert("Error generating matches");
        }
    };

    const getTeamName = (id: string) => {
        return teams.find((t) => t.id === id)?.shortName || id;
    };

    if (loading) {
        return <div className="text-center py-8">Loading...</div>;
    }

    return (
        <div className="px-4 sm:px-0">
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Matches</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Create and manage football matches
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        onClick={async () => {
                            if (confirm("⚠️ ARE YOU SURE? This will delete ALL matches, weekly sets, and stats. This cannot be undone.")) {
                                await fetch("/api/admin/reset?target=matches");
                                alert("All matches deleted.");
                                window.location.reload();
                            }
                        }}
                        className="block rounded-md bg-red-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-red-500 mr-4"
                    >
                        Reset Data
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="block rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                    >
                        Add Match
                    </button>
                    <button
                        onClick={() => setShowGenerator(true)}
                        className="block mt-2 sm:mt-0 sm:ml-4 rounded-md bg-purple-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
                    >
                        Random Gen
                    </button>
                </div>
            </div>

            {showGenerator && (
                <div className="mt-4 bg-purple-50 p-6 rounded-lg shadow border border-purple-200">
                    <h2 className="text-lg font-medium mb-4 text-purple-900">Generate Random Matches</h2>
                    <form onSubmit={handleGenerate} className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-purple-900">Target Week</label>
                            <input
                                type="number"
                                min="1"
                                value={genWeek}
                                onChange={(e) => setGenWeek(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-purple-300 shadow-sm sm:text-sm px-3 py-2 border"
                                required
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-purple-900">Count</label>
                            <input
                                type="number"
                                min="1"
                                value={genCount}
                                onChange={(e) => setGenCount(parseInt(e.target.value))}
                                className="mt-1 block w-full rounded-md border-purple-300 shadow-sm sm:text-sm px-3 py-2 border"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="rounded-md bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500"
                        >
                            Generate
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowGenerator(false)}
                            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </form>
                </div>
            )}

            {showForm && (
                <div className="mt-4 bg-white p-6 rounded-lg shadow">
                    <h2 className="text-lg font-medium mb-4">
                        {formData.id ? "Edit Match" : "New Match"}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Home Team
                                </label>
                                <select
                                    value={formData.homeTeamId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, homeTeamId: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                    required
                                >
                                    <option value="">Select team</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Away Team
                                </label>
                                <select
                                    value={formData.awayTeamId}
                                    onChange={(e) =>
                                        setFormData({ ...formData, awayTeamId: e.target.value })
                                    }
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                    required
                                >
                                    <option value="">Select team</option>
                                    {teams.map((team) => (
                                        <option key={team.id} value={team.id}>
                                            {team.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                League
                            </label>
                            <input
                                type="text"
                                value={formData.league}
                                onChange={(e) =>
                                    setFormData({ ...formData, league: e.target.value })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                placeholder="e.g., Premier League"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Kickoff Time (ISO format)
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.kickoffAt.slice(0, 16)}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        kickoffAt: new Date(e.target.value).toISOString(),
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Week
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="52"
                                value={formData.week || 1}
                                onChange={(e) =>
                                    setFormData({ ...formData, week: parseInt(e.target.value) })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Status
                            </label>
                            <select
                                value={formData.status}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        status: e.target.value as "draft" | "published" | "archived",
                                    })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                            >
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                AI Text (optional)
                            </label>
                            <textarea
                                value={formData.aiText}
                                onChange={(e) =>
                                    setFormData({ ...formData, aiText: e.target.value })
                                }
                                rows={3}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                placeholder="AI analysis or commentary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Stadium (optional)
                            </label>
                            <input
                                type="text"
                                value={formData.stadium}
                                onChange={(e) =>
                                    setFormData({ ...formData, stadium: e.target.value })
                                }
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                                placeholder="e.g., Şükrü Saraçoğlu"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForm(false);
                                    setFormData({
                                        id: "",
                                        homeTeamId: "",
                                        awayTeamId: "",
                                        league: "",
                                        kickoffAt: "",
                                        status: "draft",
                                        aiText: "",
                                        stadium: "",
                                        week: 1,
                                    });
                                }}
                                className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="mt-8 flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                                        Match
                                    </th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Week
                                    </th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        League
                                    </th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Kickoff
                                    </th>
                                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                        Status
                                    </th>
                                    <th className="relative py-3.5 pl-3 pr-4">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {matches.map((match) => (
                                    <tr key={match.id}>
                                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                                            {getTeamName(match.homeTeamId)} vs{" "}
                                            {getTeamName(match.awayTeamId)}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {match.week ? `Week ${match.week}` : '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {match.league}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                            {new Date(match.kickoffAt).toLocaleString()}
                                        </td>
                                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${match.status === "published"
                                                    ? "bg-green-100 text-green-800"
                                                    : match.status === "draft"
                                                        ? "bg-yellow-100 text-yellow-800"
                                                        : "bg-gray-100 text-gray-800"
                                                    }`}
                                            >
                                                {match.status}
                                            </span>
                                        </td>
                                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        id: match.id,
                                                        homeTeamId: match.homeTeamId,
                                                        awayTeamId: match.awayTeamId,
                                                        league: match.league,
                                                        kickoffAt: match.kickoffAt,
                                                        status: match.status,
                                                        aiText: match.aiText || "",
                                                        stadium: match.stadium || "",
                                                        week: match.week || 1,
                                                    });
                                                    setShowForm(true);
                                                }}
                                                className="text-blue-600 hover:text-blue-900 mr-4"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(match.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
