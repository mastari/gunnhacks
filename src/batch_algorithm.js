import fetch from 'node-fetch'

const suit_map = {
  0: "D",
  1: "C",
  2: "H",
  3: "S"
}

const num_map = {
  0: "A",
  1: "2",
  2: "3",
  3: "4",
  4: "5",
  5: "6",
  6: "7",
  7: "8",
  8: "9",
  9: "10",
  10: "J",
  11: "Q",
  12: "K"
}

let getWinners = async (hands, communityCards) => {
  let player_ids = Object.keys(hands)

  let hand_construct = {}
  let community_array = []

  for (let i = 0; i < player_ids.length; i++) {
    hand_construct[player_ids[i]] = []
    for (let j = 0; j < hands[player_ids[i]].length; j++) {
      hand_construct[player_ids[i]].push(num_map[hands[player_ids[i]][j].num] + suit_map[hands[player_ids[i]][j].suit])
    }
  }

  for (let i = 0; i < communityCards.length; i++) {
    community_array.push(num_map[communityCards[i].num] + suit_map[communityCards[i].suit])
  }

  let pcs = "";
  let cc = "cc=" + community_array.join(",")

  for (let i = 0; i < Object.keys(hand_construct).length; i++) {
    pcs += "&pc[]=" + hand_construct[Object.keys(hand_construct)[i]].join(",")
  }

  const POKER_API = process.env.POKER_API;
  let url = `${POKER_API}?${cc}${pcs}`;

  let response = await fetch(url)
  let result = await response.json()

  let winners = result.winners.map(winner => Object.keys(hand_construct).find(x => hand_construct[x] == winner.cards));

  return winners
}

export { getWinners };

// Example hands/community cards
//   hands = {
//     2345: [{ num: 11, suit: 0 }, { num: 12, suit: 0 }],
//     6789: [{ num: 3, suit: 2 }, { num: 4, suit: 2 }]
//   };
//   communityCards = [{ num: 5, suit: 3 }, { num: 6, suit: 3 }, { num: 7, suit: 3 }, { num: 3, suit: 3 }, { num: 11, suit: 3 }];
// output = {"winners":[{"cards":"QD,KD","hand":"4S,6S,7S,8S,QS","result":"flush"},{"cards":"4H,5H","hand":"4S,6S,7S,8S,QS","result":"flush"}],
//           "players":[{"cards":"QD,KD","hand":"4S,6S,7S,8S,QS","result":"flush"},{"cards":"4H,5H","hand":"4S,6S,7S,8S,QS","result":"flush"}]}
