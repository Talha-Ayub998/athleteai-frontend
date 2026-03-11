import { MatchResult } from "../types/events";

interface MatchResultsTableProps {
  matchNumber: number;
  matchResult: MatchResult | null;
}

const getResultBadgeClass = (result: string) => {
  const normalized = result.trim().toLowerCase();
  if (normalized === "win") return "result-badge win";
  if (normalized === "lost" || normalized === "loss")
    return "result-badge loss";
  if (normalized === "draw") return "result-badge draw";
  return "result-badge";
};

export function MatchResultsTable({
  matchNumber,
  matchResult,
}: MatchResultsTableProps) {
  if (!matchResult) {
    return (
      <div className="bg-card rounded-lg p-8 text-center border border-border">
        <p className="text-muted-foreground">
          No result recorded yet for Match {matchNumber}.
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
              <th className="w-56">Opponent</th>
              <th className="w-32">Result</th>
              <th className="w-56">Match Type</th>
              <th className="w-40">Referee Decision</th>
              <th className="w-32">Disqualified</th>
            </tr>
          </thead>
          <tbody>
            <tr key={matchResult.id} className="animate-fade-in">
              <td className="text-white">{matchResult.opponent || "-"}</td>
              <td>
                <span className={getResultBadgeClass(matchResult.result)}>
                  {matchResult.result || "Unknown"}
                </span>
              </td>
              <td className="text-muted-foreground">
                {matchResult.matchType || "-"}
              </td>
              <td className="text-muted-foreground">
                {matchResult.refereeDecision ? "Yes" : "No"}
              </td>
              <td className="text-muted-foreground">
                {matchResult.disqualified ? "Yes" : "No"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
