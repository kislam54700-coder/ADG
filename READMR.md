# ⚔️ ADG — Anime Draft Game

ADG is a private online multiplayer anime character drafting and battle game.

## Game Flow

```text
Anime Selection
      ↓
Match Creation / Join
      ↓
Character Draft
      ↓
Role Assignment
      ↓
Battle Arena
      ↓
Winner
```

## Core Rules

* 2 players per match.
* Each player drafts exactly 6 unique characters.
* Draft turns alternate between Player 1 and Player 2.
* Character statistics remain hidden from players.
* Each player receives 1 Drop Token.
* The Drop Token can be used after the player has drafted 6 characters.
* Dropping a character gives the player a replacement character.
* Each player assigns exactly 6 unique roles.
* Every role can only be used once.
* Available roles:

  * Captain
  * Vice-Captain
  * Tank
  * Healer
  * Support
  * Traitor
* The server is authoritative for multiplayer state.
* Opponent private draft information is not sent to the player's draft page.

## Required Software

* Node.js 18 or newer
* npm
* A modern web browser

## Installation

Open the ADG project directory in a terminal.

Run:

```bash
npm install
```

Then start the server:

```bash
npm start
```

The server will normally run on:

```text
http://localhost:3000
```

Open that address in your browser.

## Project Structure

```text
ADG/
│
├── index.html
├── draft.html
├── roles.html
├── game.html
├── README.md
├── package.json
├── server.js
│
├── css/
│   └── style.css
│
├── js/
│   ├── app.js
│   ├── database.js
│   ├── draft.js
│   ├── roles.js
│   ├── game.js
│   ├── sound.js
│   └── firebase.js
│
└── assist/
    └── characters/
        └── one-piece/
            ├── Monkey D. Luffy.jpg
            ├── Roronoa Zoro.jpg
            ├── Sanji.jpg
            └── ...
```

## Multiplayer

ADG uses Socket.IO for real-time communication.

Important server events include:

```text
match:create
match:join
match:reconnect

draft:draw
draft:drop

roles:assign

match:leave
```

The server controls:

* Match state
* Player assignment
* Draft turns
* Character pool
* Character ownership
* Drop Token state
* Role validation
* Phase transitions

## Security Principle

The browser should never be trusted as the final authority for:

* Character ownership
* Draft validity
* Turn ownership
* Role validity
* Match completion
* Battle results

The server must validate important game actions.

## Current Anime

The initial database supports:

```text
One Piece
```

Additional anime can be added later.

## Development

Start the server with:

```bash
npm start
```

For development:

```bash
npm run dev
```

The current `dev` command starts the same Node.js server without automatic file watching.

## Health Check

The server provides:

```text
/health
```

Example:

```text
http://localhost:3000/health
```

A successful response contains:

```json
{
  "ok": true
}
```

## Important

Do not deploy the game publicly until the complete multiplayer flow has been tested.

Recommended testing order:

1. Create a match.
2. Join with Player 2.
3. Test alternating drafts.
4. Test the 6-character limit.
5. Test Drop Token.
6. Test role assignment.
7. Test both-player completion.
8. Test battle synchronization.
9. Test reconnecting after disconnect.
10. Test leaving a match.

## License

Private project.
