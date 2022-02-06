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

let identify_batch = async (hands, communityCards) => {
  hands = {
    12345: [{ num: 11, suit: 2 }, { num: 4, suit: 2 }],
    4321: [{ num: 2, suit: 2 }, { num: 4, suit: 2 }]
  };

  communityCards = [{ num: 3, suit: 1 }, { num: 11, suit: 0 }, { num: 6, suit: 2 }];


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


  let base_url = 'https://api.pokerapi.dev/v1/winner/texas_holdem?'

  let url = base_url + cc + pcs;
  url = `https://api.pokerapi.dev/v1/winner/texas_holdem?cc=4C,QD,7H&pc[]=3H,5H&pc[]=QH,5H`
  console.log(url)

  let response = await fetch(url)
  let result = await response.json()

  return result
}


export { identify_batch };

// let request = new XMLHttpRequest();
// request.open("GET", 'https://api.pokerapi.dev/v1/winner/texas_holdem?cc=AC,KD,QH,JS,7C&pc[]=10S,8C&pc[]=3S,2C&pc[]=QS,JH&pc[]=&pc[]=&pc[]=')
// request.send()
// request.onload = () => {
//   console.log(request)
//   if (request.status == 200) {
//     result = JSON.parse(request.response)
//   } else {
//     console.log(`error ${request.status} ${request.statusText}`)
//   }
// }