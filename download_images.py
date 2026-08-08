import json
import os
import re
import time
import urllib.parse
import urllib.request

# ============================================================
# ADG - ONE PIECE CHARACTER IMAGE DOWNLOADER
# ============================================================

BASE_DIR = os.path.join(
    "assets",
    "characters",
    "one-piece"
)

HEADERS = {
    "User-Agent": "ADG-Anime-Draft-Game/1.0"
}


# ============================================================
# CHARACTER LIST
# ============================================================

CHARACTERS = [
    ("Luffy", "Monkey D. Luffy"),
    ("Zoro", "Roronoa Zoro"),
    ("Sanji", "Sanji (One Piece)"),
    ("Nami", "Nami (One Piece)"),
    ("Usopp", "Usopp"),
    ("Chopper", "Tony Tony Chopper"),
    ("Robin", "Nico Robin"),
    ("Franky", "Franky (One Piece)"),
    ("Brook", "Brook (One Piece)"),
    ("Jinbe", "Jinbe (One Piece)"),

    ("Shanks", "Shanks (One Piece)"),
    ("Benn Beckman", "Benn Beckman"),
    ("Yasopp", "Yasopp"),
    ("Lucky Roux", "Lucky Roux"),

    ("Gol D. Roger", "Gol D. Roger"),
    ("Silvers Rayleigh", "Silvers Rayleigh"),
    ("Scopper Gaban", "Scopper Gaban"),

    ("Portgas D. Ace", "Portgas D. Ace"),
    ("Sabo", "Sabo (One Piece)"),
    ("Monkey D. Dragon", "Monkey D. Dragon"),
    ("Garp", "Monkey D. Garp"),

    ("Trafalgar Law", "Trafalgar D. Water Law"),
    ("Eustass Kid", "Eustass Kid"),
    ("Killer", "Killer (One Piece)"),
    ("Jewelry Bonney", "Jewelry Bonney"),
    ("Basil Hawkins", "Basil Hawkins"),
    ("X Drake", "X Drake"),
    ("Scratchmen Apoo", "Scratchmen Apoo"),
    ("Capone Bege", "Capone Bege"),
    ("Urouge", "Urouge"),

    ("Whitebeard", "Edward Newgate"),
    ("Marco", "Marco (One Piece)"),
    ("Jozu", "Jozu (One Piece)"),
    ("Vista", "Vista (One Piece)"),
    ("Izo", "Izo (One Piece)"),

    ("Kaido", "Kaido (One Piece)"),
    ("King", "King (One Piece)"),
    ("Queen", "Queen (One Piece)"),
    ("Jack", "Jack (One Piece)"),
    ("Yamato", "Yamato (One Piece)"),

    ("Big Mom", "Charlotte Linlin"),
    ("Katakuri", "Charlotte Katakuri"),
    ("Smoothie", "Charlotte Smoothie"),
    ("Cracker", "Charlotte Cracker"),
    ("Perospero", "Charlotte Perospero"),

    ("Blackbeard", "Marshall D. Teach"),
    ("Shiryu", "Shiryu (One Piece)"),
    ("Van Augur", "Van Augur"),
    ("Jesus Burgess", "Jesus Burgess"),
    ("Laffitte", "Laffitte (One Piece)"),
    ("Doc Q", "Doc Q"),
    ("Avalo Pizarro", "Avalo Pizarro"),

    ("Mihawk", "Dracule Mihawk"),
    ("Crocodile", "Crocodile (One Piece)"),
    ("Doflamingo", "Donquixote Doflamingo"),
    ("Boa Hancock", "Boa Hancock"),
    ("Buggy", "Buggy (One Piece)"),

    ("Akainu", "Sakazuki (One Piece)"),
    ("Aokiji", "Kuzan (One Piece)"),
    ("Kizaru", "Borsalino (One Piece)"),
    ("Fujitora", "Issho (One Piece)"),
    ("Ryokugyu", "Aramaki (One Piece)"),

    ("Sengoku", "Sengoku (One Piece)"),
    ("Tsuru", "Tsuru (One Piece)"),
    ("Koby", "Koby (One Piece)"),
    ("Helmeppo", "Helmeppo"),
    ("Smoker", "Smoker (One Piece)"),
    ("Tashigi", "Tashigi"),

    ("Enel", "Enel (One Piece)"),
    ("Rob Lucci", "Rob Lucci"),
    ("Kaku", "Kaku (One Piece)"),
    ("Blueno", "Blueno"),
    ("Magellan", "Magellan (One Piece)"),
    ("Caesar Clown", "Caesar Clown"),
    ("Gecko Moria", "Gecko Moria"),
    ("Bartholomew Kuma", "Bartholomew Kuma"),

    ("Oden", "Kozuki Oden"),
    ("Kin'emon", "Kin'emon"),
    ("Denjiro", "Denjiro"),
    ("Kawamatsu", "Kawamatsu (One Piece)"),
    ("Raizo", "Raizo (One Piece)"),
    ("Kikunojo", "Kikunojo"),
    ("Ashura Doji", "Ashura Doji"),
    ("Inuarashi", "Inuarashi"),
    ("Nekomamushi", "Nekomamushi"),

    ("Vegapunk", "Dr. Vegapunk"),
    ("Stussy", "Stussy (One Piece)"),
    ("Sentomaru", "Sentomaru"),

    ("Imu", "Imu (One Piece)"),
    ("Saint Saturn", "Jaygarcia Saturn"),
    ("Saint Mars", "Marcus Mars"),
    ("Saint Warcury", "Topman Warcury"),
    ("Saint Nusjuro", "Ethanbaron V. Nusjuro"),
    ("Saint Ju Peter", "Shepherd Ju Peter"),

    ("Arlong", "Arlong (One Piece)"),
    ("Don Krieg", "Don Krieg"),
    ("Mr. 1", "Daz Bonez"),
    ("Mr. 2 Bon Clay", "Bentham (One Piece)"),
    ("Mr. 3", "Galdino (One Piece)"),
    ("Mr. 5", "Gem (One Piece)"),
    ("Bellamy", "Bellamy (One Piece)"),
    ("Hody Jones", "Hody Jones"),
]


# ============================================================
# FILENAME
# ============================================================

def make_filename(character_name):
    """
    Convert character name to the exact ADG filename.

    Example:
    Monkey D. Dragon -> monkey-d-dragon.jpg
    Mr. 2 Bon Clay   -> mr-2-bon-clay.jpg
    """

    name = character_name.lower()

    name = name.replace("'", "")

    name = re.sub(r"[^a-z0-9]+", "-", name)

    name = name.strip("-")

    return name + ".jpg"


# ============================================================
# WIKIPEDIA SEARCH
# ============================================================

def get_image_url(search_term):

    api_url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode({
        "action": "query",
        "format": "json",
        "prop": "pageimages",
        "piprop": "thumbnail",
        "pithumbsize": 800,
        "titles": search_term
    })

    request = urllib.request.Request(
        api_url,
        headers=HEADERS
    )

    with urllib.request.urlopen(
        request,
        timeout=15
    ) as response:

        data = json.loads(
            response.read().decode("utf-8")
        )

    pages = data.get("query", {}).get("pages", {})

    for page in pages.values():

        thumbnail = page.get("thumbnail")

        if thumbnail:

            return thumbnail.get("source")

    return None


# ============================================================
# DOWNLOAD
# ============================================================

def download_image(image_url, output_file):

    request = urllib.request.Request(
        image_url,
        headers=HEADERS
    )

    with urllib.request.urlopen(
        request,
        timeout=20
    ) as response:

        data = response.read()

    with open(
        output_file,
        "wb"
    ) as file:

        file.write(data)


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 60)
    print("        ⚔️ ADG ONE PIECE IMAGE DOWNLOADER")
    print("=" * 60)
    print()

    # Create directory
    os.makedirs(
        BASE_DIR,
        exist_ok=True
    )

    print("📁 Image folder:")
    print(os.path.abspath(BASE_DIR))
    print()

    downloaded = 0
    skipped = 0
    failed = []

    total = len(CHARACTERS)

    print(f"Characters: {total}")
    print()

    for number, (character_name, search_term) in enumerate(
        CHARACTERS,
        start=1
    ):

        filename = make_filename(
            character_name
        )

        output_file = os.path.join(
            BASE_DIR,
            filename
        )

        print(
            f"[{number}/{total}] {character_name}"
        )

        # Existing image
        if os.path.exists(output_file):

            print("   ⏭️ Already exists")

            skipped += 1

            continue

        try:

            print("   🔎 Searching Wikipedia...")

            image_url = get_image_url(
                search_term
            )

            if not image_url:

                print("   ❌ Image not found")

                failed.append(
                    character_name
                )

                continue

            print("   ⬇️ Downloading...")

            download_image(
                image_url,
                output_file
            )

            print(
                f"   ✅ Saved: {filename}"
            )

            downloaded += 1

        except Exception as error:

            print(
                f"   ❌ Error: {error}"
            )

            failed.append(
                character_name
            )

        # Small delay
        time.sleep(0.3)

        print()


    # ========================================================
    # SUMMARY
    # ========================================================

    print("=" * 60)
    print("                    COMPLETE")
    print("=" * 60)

    print()
    print(f"✅ Downloaded : {downloaded}")
    print(f"⏭️ Skipped    : {skipped}")
    print(f"❌ Failed     : {len(failed)}")

    if failed:

        print()
        print("Characters that need attention:")
        print()

        for character in failed:

            print(
                f"   - {character}"
            )

    print()
    print("📁 Images saved to:")

    print(
        os.path.abspath(BASE_DIR)
    )

    print()
    print("🏴‍☠️ ADG image download finished!")
    print()


# ============================================================
# START
# ============================================================

if __name__ == "__main__":
    main()