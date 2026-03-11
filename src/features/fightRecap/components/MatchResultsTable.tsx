import { MatchResult } from "../types/events";

interface MatchResultsTableProps {
  matchResults: MatchResult[];
}

const getResultBadgeClass = (result: string) => {
  const normalized = result.trim().toLowerCase();
  if (normalized === "win") return "result-badge win";
  if (normalized === "lost" || normalized === "loss")
    return "result-badge loss";
  if (normalized === "draw") return "result-badge draw";
  return "result-badge";
};

export function MatchResultsTable({ matchResults }: MatchResultsTableProps) {
  const sortedResults = [...matchResults].sort(
    (a, b) => a.matchNumber - b.matchNumber,
  );

  if (sortedResults.length === 0) {
    return (
      <div className="bg-card rounded-lg p-8 text-center border border-border">
        <p className="text-muted-foreground">
          No match results recorded yet for this session.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg overflow-hidden border border-border">
      <div className="overflow-x-auto">
        <table className="event-table">
          <thead>
            <tr>
              <th className="w-32">Match</th>
              <th className="w-56">Opponent</th>
              <th className="w-32">Result</th>
              <th className="w-56">Match Type</th>
              <th className="w-40">Referee Decision</th>
              <th className="w-32">Disqualified</th>
            </tr>
          </thead>
          <tbody>
            {sortedResults.map((result, index) => (
              <tr
                key={result.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <td className="font-medium text-white">
                  #{result.matchNumber}
                </td>
                <td className="text-white">{result.opponent || "-"}</td>
                <td>
                  <span className={getResultBadgeClass(result.result)}>
                    {result.result || "Unknown"}
                  </span>
                </td>
                <td className="text-muted-foreground">
                  {result.matchType || "-"}
                </td>
                <td className="text-muted-foreground">
                  {result.refereeDecision ? "Yes" : "No"}
                </td>
                <td className="text-muted-foreground">
                  {result.disqualified ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
