import { SmiteApi } from './SmiteApi.js'
import CONSTANTS from './constants/index.js'
import _ from 'lodash';
import cachedDataBkp from './data/matches.json' assert { type: 'json' };
import cachedResultData from './data/resultData.json' assert { type: 'json' };
import fs from 'fs';
import dotenv  from "dotenv"

let cachedData = Object.assign({}, cachedDataBkp)
dotenv.config()

const smiteApiClient = new SmiteApi({
    auth_key: process.env.AUTH_KEY,
    dev_id: process.env.DEV_ID,
})

const splitIntoChunk = (arr, chunk) => {
    const chunkedArr = []
    while(arr.length > 0) {
        let tempArray;
        tempArray = arr.splice(0, chunk);
        chunkedArr.push(tempArray)
    }
    return chunkedArr
}


const updateCachedData = async (date, hour) => {
    // Get matches from a specific time
    const matchesInTimeframe = await smiteApiClient.performRequest(CONSTANTS.METHODS.GET_MATCH_IDS_BY_QUEUE, CONSTANTS.QUEUE_IDS.RANKED_CONQUEST_PC ,date, hour)


    // Get Match info for new matches
    const newMatchesList = matchesInTimeframe
                            .filter((matchInfo) => !Object.keys(cachedData).includes(matchInfo.Match))       // Dont repeat cached matches
                            .filter(matchData => matchData['Active_Flag'] === 'n')                           // only get active matches
                            .map(matchData => matchData['Match'])                                            // extract match ids
    console.log(`Discovered ${newMatchesList.length} new matches`);
    const chunkedMatches = splitIntoChunk(newMatchesList, 10)
    const allMatchDetails = await Promise.all(chunkedMatches.map(async (matches, i) => {
        console.log(`Calling api for batch ${i}`);
        const matchDetailsBatch = await smiteApiClient.performRequest(CONSTANTS.METHODS.GET_MATCH_DETAILS_BATCH, matches)
        const groupedMatches = _.groupBy(matchDetailsBatch, 'Match')
        return Promise.resolve(groupedMatches)
      }));

    const groupedMatchDetails = _.reduce(allMatchDetails, (response, a) => _.merge(response, a), {})
    

    // console.log(groupedMatchDetails);
    
    Object.keys(groupedMatchDetails).forEach((matchId) => {
        const matchDetails = groupedMatchDetails[matchId]
        const filteredMatchDetails = matchDetails.map((playerDetails) => {
            return _.reduce(CONSTANTS.EXTRACT_LIST, (response, item) => {
                response[item] = playerDetails[item]
                return response
            }, {});
        })

        // Grouping data to make it easy to process later
        const winLoseGroupedMatchDetails = _.groupBy(filteredMatchDetails, 'Win_Status');
        Object.keys(winLoseGroupedMatchDetails).forEach((winStatus) => {
            const teamDetails = winLoseGroupedMatchDetails[winStatus];
            winLoseGroupedMatchDetails[winStatus] = _.reduce(teamDetails, (response, item) => {
                response[item.Role] = item;
                return response;
            }, {});
        })
        cachedData[matchId] = winLoseGroupedMatchDetails
    })


    // Writing new cached matches locally, and using cached Data going forward
    
    return cachedData;

}

const addCounterBuildDataToExistingData = (existingCounterData, newData, winMultiplier) => {
    const newItemData = existingCounterData.Items.map((itemSlot, itemSlotNum) => {
        const itemId = newData[`ItemId${itemSlotNum+1}`]
        if (itemId === 0) {
            return itemSlot
        }
        if (!itemSlot.hasOwnProperty(itemId)) {
            itemSlot[itemId] = 0
        }
        itemSlot[itemId] = itemSlot[itemId] + Math.round(1 + winMultiplier)
        return itemSlot  
    })
    return {
        "Items": newItemData,
        "Relics": [{}, {}]
    }
}

const getKDA = (playerDetails) => {
    if ((playerDetails.Kills_Player + playerDetails.Assists) === 0) return 0;
    if (playerDetails.Deaths === 0) return playerDetails.Kills_Player + playerDetails.Assists;
    return (playerDetails.Kills_Player + playerDetails.Assists) / playerDetails.Deaths 
}

const processNewCounterBuildData = (matchData) => {
    const resultData =  _.reduce(Object.keys(matchData), (resultData, b) => {
        const matchDetails = matchData[b]
        const winningTeamDetails = matchDetails[CONSTANTS.WIN_STATUS]
        const losingTeamDetails = matchDetails[CONSTANTS.LOSE_STATUS]



        CONSTANTS.ROLES.forEach((roleName) => {
            try {
                // Get better player by player kills
                const winningPlayerDetails = winningTeamDetails[roleName]
                const losingPlayerDetails = losingTeamDetails[roleName]

                const playerOneKills = getKDA(winningPlayerDetails)
                const playerTwoKills = getKDA(losingPlayerDetails)
                const betterPlayerDetails = playerOneKills >= playerTwoKills ? winningPlayerDetails : losingPlayerDetails
                const worsePlayerDetails = playerOneKills < playerTwoKills ? winningPlayerDetails : losingPlayerDetails

                const winMultiplier = Math.round(Math.abs(getKDA(winningPlayerDetails) - getKDA(losingPlayerDetails)))

                // if (betterPlayerDetails.Reference_Name === "Odin" && worsePlayerDetails.Reference_Name === "Anubis" && roleName === 'Solo') {
                //     console.log("here")
                // }


                if (betterPlayerDetails.Role === 'Unknown' || getKDA(winningPlayerDetails) === NaN) {
                    console.log("Found data with incomplete info.")
                    return;
                }

                // Add to dataset
                if (!resultData.hasOwnProperty(roleName)) {
                    resultData[roleName] = {
                        "NumMatchesEvaluated": 0
                    }
                }
                resultData[roleName].NumMatchesEvaluated = resultData[roleName].NumMatchesEvaluated + 1

                if (!resultData[roleName].hasOwnProperty(betterPlayerDetails.GodId)) {
                    resultData[roleName][betterPlayerDetails.GodId] = {
                        "Reference_Name": betterPlayerDetails.Reference_Name,
                        "GodId": betterPlayerDetails.GodId,
                        "NumMatchesEvaluated": 0,
                        "Opponent": {}
                    }
                }

                resultData[roleName][betterPlayerDetails.GodId].NumMatchesEvaluated = resultData[roleName][betterPlayerDetails.GodId].NumMatchesEvaluated + 1

                if (!resultData[roleName][betterPlayerDetails.GodId].Opponent.hasOwnProperty(worsePlayerDetails.GodId)) {
                    resultData[roleName][betterPlayerDetails.GodId].Opponent[worsePlayerDetails.GodId] = {
                        "Reference_Name": worsePlayerDetails.Reference_Name,
                        "GodId": worsePlayerDetails.GodId,
                        "NumMatchesEvaluated": 0,
                        "CounterBuilds": {
                            "Items": [{},{},{},{},{},{}],
                            "Relics": [{}, {}]
                        }
                    }
                }

                resultData[roleName][betterPlayerDetails.GodId].Opponent[worsePlayerDetails.GodId].NumMatchesEvaluated = resultData[roleName][betterPlayerDetails.GodId].Opponent[worsePlayerDetails.GodId].NumMatchesEvaluated + 1

                const existingCounterBuildData = resultData[roleName][betterPlayerDetails.GodId].Opponent[worsePlayerDetails.GodId].CounterBuilds

                
                resultData[roleName][betterPlayerDetails.GodId].Opponent[worsePlayerDetails.GodId].CounterBuilds = addCounterBuildDataToExistingData(existingCounterBuildData, betterPlayerDetails, winMultiplier)
            } catch (e) {
                // console.log(e)
                console.log("match role extraction failed")
            }

            
        })
        return resultData
    }, cachedResultData);

    fs.writeFileSync('./data/resultData.json', JSON.stringify(resultData))
    return resultData
}

const refreshMetadataAssets = async () => {
    const godsMetadata = await smiteApiClient.performRequest(CONSTANTS.METHODS.GET_GODS, CONSTANTS.LANGS.ENGLISH)
    const filteredGodMetadata = godsMetadata.map((godMetadata) => {
        return _.pick(godMetadata, ['Name', 'Roles', 'godCard_URL', 'godIcon_URL', 'id'])
    })
    fs.writeFileSync('./data/godsMetadata.json', JSON.stringify(filteredGodMetadata))

    const itemsMetadata = await smiteApiClient.performRequest(CONSTANTS.METHODS.GET_ITEMS, CONSTANTS.LANGS.ENGLISH)
    const filteredItemMetadata = itemsMetadata.map((itemMetadata) => {
        return _.pick(itemMetadata, ['ActiveFlag', 'RootItemId', 'DeviceName', 'ItemId', 'itemIcon_URL'])
    })
    fs.writeFileSync('./data/itemsMetadata.json', JSON.stringify(filteredItemMetadata))
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const run = async () => {

    // for (let day = 20220725; day < 20220730; day++) {
    //     for (let i = 1; i < 23; i++) {
    //         try {
    //             console.log(`Iteration is ${day.toString()} : #${i}`);
    //             await sleep(500);
    //             cachedData = await updateCachedData(day.toString(), i.toString());
    //         } catch {
    //             console.log("Failed for this iteration")
    //         }
            
    //     }
    // }

    const finalObject = _.pickBy(cachedData, function(value, key) {
        return !(Object.keys(value['Winner']).includes("Unknown") || Object.keys(value['Loser']).includes("Unknown"))
      });

    
    // fs.writeFileSync('./data/matches.json', JSON.stringify(finalObject))




    const resultData = processNewCounterBuildData(finalObject);

    // await refreshMetadataAssets()
}



run()