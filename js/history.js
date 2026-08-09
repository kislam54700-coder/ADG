document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    // =========================================================
    // ELEMENTS
    // =========================================================

    const historyContainer =
        document.getElementById(
            "historyContainer"
        );

    const historyStatus =
        document.getElementById(
            "historyStatus"
        );

    const backBtn =
        document.getElementById(
            "backBtn"
        );

    const clearHistoryBtn =
        document.getElementById(
            "clearHistoryBtn"
        );


    // =========================================================
    // HTML SAFETY
    // =========================================================

    function escapeHtml(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    // =========================================================
    // LOAD HISTORY
    // =========================================================

    function loadHistory() {

        try {

            const saved =
                JSON.parse(
                    localStorage.getItem(
                        "battleHistory"
                    ) || "[]"
                );

            if (!Array.isArray(saved)) {
                return [];
            }

            return saved;

        } catch (error) {

            console.error(
                "Unable to load battle history:",
                error
            );

            return [];
        }
    }


    // =========================================================
    // DATE FORMAT
    // =========================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "Unknown date";
        }

        const date =
            new Date(dateValue);

        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "Unknown date";
        }

        return date.toLocaleString();
    }


    // =========================================================
    // WINNER TEXT
    // =========================================================

    function getWinnerText(winner) {

        if (winner === 1) {
            return "🏆 PLAYER 1 WINS";
        }

        if (winner === 2) {
            return "🏆 PLAYER 2 WINS";
        }

        return "🤝 DRAW";
    }


    // =========================================================
    // TEAM HTML
    // =========================================================

    function buildTeam(team) {

        if (
            !team ||
            !Array.isArray(team)
        ) {

            return `
                <p>
                    No team data available.
                </p>
            `;
        }

        return team.map(fighter => {

            const hp =
                Math.max(
                    0,
                    Number(
                        fighter.remainingHP
                    ) || 0
                );

            return `
                <div class="history-fighter">

                    <strong>
                        ${escapeHtml(
                            fighter.name || "Unknown"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            fighter.role || "Unknown"
                        )}
                    </span>

                    <span>
                        ❤️ ${Math.floor(hp)}
                    </span>

                    <span>
                        💥 ${Math.floor(
                            Number(
                                fighter.damageDealt
                            ) || 0
                        )}
                    </span>

                    <span>
                        💀 ${Number(
                            fighter.KOs
                        ) || 0}
                    </span>

                    <span>
                        🔥 ${Number(
                            fighter.specialsUsed
                        ) || 0}
                    </span>

                </div>
            `;

        }).join("");
    }


    // =========================================================
    // SINGLE BATTLE CARD
    // =========================================================

    function buildBattleCard(
        battle,
        index
    ) {

        const winner =
            Number(
                battle.winner
            ) || 0;

        const rounds =
            Number(
                battle.rounds
            ) || 0;

        const statistics =
            battle.statistics || {};


        return `
            <div
                class="history-card"
                data-history-index="${index}">

                <!-- HEADER -->

                <div class="history-card-header">

                    <div>

                        <h2>
                            ${getWinnerText(winner)}
                        </h2>

                        <p>
                            📅 ${escapeHtml(
                                formatDate(
                                    battle.date
                                )
                            )}
                        </p>

                    </div>

                    <div>

                        <strong>
                            ⚔️ Battle #${index + 1}
                        </strong>

                        <p>
                            🔄 ${rounds} rounds
                        </p>

                    </div>

                </div>


                <!-- TEAMS -->

                <div class="history-teams">


                    <!-- PLAYER 1 -->

                    <div class="history-team">

                        <h3>
                            🏴 PLAYER 1
                        </h3>

                        ${buildTeam(
                            battle.player1 &&
                            battle.player1.team
                        )}

                    </div>


                    <!-- PLAYER 2 -->

                    <div class="history-team">

                        <h3>
                            🏴 PLAYER 2
                        </h3>

                        ${buildTeam(
                            battle.player2 &&
                            battle.player2.team
                        )}

                    </div>

                </div>


                <!-- BATTLE STATISTICS -->

                <div class="history-statistics">

                    <h3>
                        📊 Battle Statistics
                    </h3>

                    <p>
                        💥 Total Damage:
                        <strong>
                            ${Math.floor(
                                Number(
                                    statistics.totalDamage
                                ) || 0
                            )}
                        </strong>
                    </p>

                    <p>
                        💀 Total KOs:
                        <strong>
                            ${Number(
                                statistics.totalKOs
                            ) || 0}
                        </strong>
                    </p>

                    <p>
                        🔥 Specials:
                        <strong>
                            ${Number(
                                statistics.totalSpecials
                            ) || 0}
                        </strong>
                    </p>

                    <p>
                        🔄 Rounds:
                        <strong>
                            ${rounds}
                        </strong>
                    </p>

                </div>

            </div>
        `;
    }


    // =========================================================
    // DISPLAY HISTORY
    // =========================================================

    function displayHistory() {

        const history =
            loadHistory();


        if (
            !historyContainer
        ) {
            return;
        }


        historyContainer.innerHTML =
            "";


        // No history

        if (
            history.length === 0
        ) {

            if (historyStatus) {

                historyStatus.textContent =
                    "📭 No battles recorded yet.";
            }

            historyContainer.innerHTML = `
                <div class="history-empty">

                    <h2>
                        📭 No Battle History
                    </h2>

                    <p>
                        Complete a battle to
                        create your first
                        history record.
                    </p>

                </div>
            `;

            return;
        }


        // History exists

        if (historyStatus) {

            historyStatus.textContent =
                `📜 ${history.length} battle` +
                `${history.length === 1 ? "" : "s"} recorded.`;
        }


        // Newest battle first

        const reversedHistory =
            [...history].reverse();


        reversedHistory.forEach(
            (battle, reversedIndex) => {

                const originalIndex =
                    history.length -
                    reversedIndex -
                    1;

                historyContainer.insertAdjacentHTML(
                    "beforeend",
                    buildBattleCard(
                        battle,
                        originalIndex
                    )
                );

            }
        );
    }


    // =========================================================
    // CLEAR HISTORY
    // =========================================================

    function clearHistory() {

        const history =
            loadHistory();

        if (
            history.length === 0
        ) {

            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to delete all battle history?"
            );


        if (!confirmed) {
            return;
        }


        localStorage.removeItem(
            "battleHistory"
        );


        displayHistory();
    }


    // =========================================================
    // BUTTONS
    // =========================================================

    if (backBtn) {

        backBtn.addEventListener(
            "click",
            () => {

                window.history.back();

            }
        );
    }


    if (clearHistoryBtn) {

        clearHistoryBtn.addEventListener(
            "click",
            clearHistory
        );
    }


    // =========================================================
    // INITIAL LOAD
    // =========================================================

    displayHistory();

});