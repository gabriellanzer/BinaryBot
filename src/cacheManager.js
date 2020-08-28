// Dependencies
const App = require("./binaryBot");
const FS = require('fs');
const ReadLine = require("readline-sync");

// Internal State
let simulation_seconds = 0;
let remaining_seconds = 0;
let end_time = 0;
let price_list = [];
let time_list = [];
let cache_dir = "";
let mktSymbol = "";

// Should Request New Cache
async function GetCache(cache_path, mkt_symbol) {
    cache_dir = cache_path;
    mktSymbol = mkt_symbol;
    console.log("\nChecking for existing cache files...");
    let cacheExists = FS.existsSync(cache_dir);
    if (cacheExists) {
        cacheExists = ReadLine.keyInYNStrict("Cache found! Use existing cache(y), or generate new(n)?")
    } else {
        console.log("Could not find existing cache file, generating new file!");
    }
    if (!cacheExists) {
        return await GenerateNewCacheFile();
    } else {
        return await ReadCacheFile();
    }
}


async function ReadCacheFile() {
    return new Promise(function (res, err) {
        let fileBuff;
        try {
            fileBuff = FS.readFileSync(cache_dir);
        } catch (exc) {
            err(exc);
        }
        // Read first line
        let lstPos = 0;
        let lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
        const iniDate = new Date(fileBuff.slice(lstPos, lnPos).toString());
        // Read second line
        lstPos = lnPos + 1;
        lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
        const lastDate = new Date(fileBuff.slice(lstPos, lnPos).toString());
        // Read third line
        lstPos = lnPos + 1;
        lnPos = fileBuff.indexOf("\n", byteOffset = lstPos);
        const tickCount = parseInt(fileBuff.slice(lstPos, lnPos));
        console.log(
            "Using Cache from '" + iniDate.toUTCString() + "' to '" +
            lastDate.toUTCString() + "' with " + tickCount + " Ticks!\n"
        );
        // Read Binary Prices
        lstPos = lnPos + 1;
        const pricesBuffer = Buffer.from(
            fileBuff.slice(lstPos, lstPos + tickCount * 4),
            "binary"
        );
        let offset = 0;
        for (let i = 0; i < tickCount; i++) {
            price_list.push(pricesBuffer.readFloatBE(offset));
            offset += 4;
        }
        // Read Binary Times
        lstPos += tickCount * 4
        const timesBuffer = Buffer.from(
            fileBuff.slice(lstPos, lstPos + tickCount * 4),
            "binary"
        );
        offset = 0;
        for (let i = 0; i < tickCount; i++) {
            time_list.push(timesBuffer.readInt32BE(offset));
            offset += 4;
        }
        res([
            price_list,
            time_list
        ]);
    });
}

async function GenerateNewCacheFile() {
    return new Promise(function (res, err) {
        const simulationHours = ReadLine.questionInt("How many hours, starting now, would you like to cache: ");
        console.log(`Querying server for ${simulationHours} hours in ticks!`);
        simulation_seconds = simulationHours * 3600;
        remaining_seconds = simulation_seconds;

        App.SingleUse("time", msg => {
            end_time = msg.time;
            App.Send({
                ticks_history: mktSymbol,
                adjust_start_time: 1,
                end: end_time,
                start: end_time - Math.min(remaining_seconds, 5000),
                style: "ticks"
            });
        });

        App.Use("history", msg => {
            // Remaining size
            end_time -= Math.min(remaining_seconds, 5000);
            remaining_seconds -= Math.min(remaining_seconds, 5000);

            // Progress
            const downloadProg = (1.0 - (remaining_seconds / simulation_seconds)) * 100;
            console.log(`Downloading cache progress: ${downloadProg.toFixed(2)}%`);

            // Append to tick list
            const { prices, times } = msg.history;
            prices.reverse();
            times.reverse();
            for (let i = 0; i < prices.length; i++) {
                price_list.push(prices[i]);
                time_list.push(times[i]);
            }

            // New Request?
            if (remaining_seconds > 0) {
                App.Send({
                    ticks_history: mktSymbol,
                    adjust_start_time: 1,
                    end: end_time,
                    start: end_time - Math.min(remaining_seconds, 5000),
                    style: "ticks"
                });
            } else // Download completed!
            {
                console.log(`Cache download completed... ${time_list.length} ticks gathered!`);
                console.log(`Writing cache file...`);
                let wrStream;
                try {
                    wrStream = FS.createWriteStream(cache_dir);
                } catch (exc) {
                    err(exc);
                }
                const iniTime = new Date(time_list[0] * 1000);
                const lastTime = new Date(time_list[time_list.length - 1] * 1000);
                // Write Ini Date, Last Date and Tick Count on separated lines
                wrStream.write(`${iniTime}\n${lastTime}\n${time_list.length}\n`);
                // Write Prices
                const pricesBuffer = Buffer.alloc(price_list.length * 4);
                let offset = 0;
                for (let i = 0; i < price_list.length; i++) {
                    pricesBuffer.writeFloatBE(price_list[i], offset);
                    offset += 4;
                }
                wrStream.write(pricesBuffer, "binary");
                // Write Times
                const timesBuffer = Buffer.alloc(time_list.length * 4);
                offset = 0;
                for (let i = 0; i < time_list.length; i++) {
                    timesBuffer.writeInt32BE(time_list[i], offset);
                    offset += 4;
                }
                wrStream.write(timesBuffer, "binary");
                wrStream.close();
                wrStream.on("close", () => {
                    console.log(`Done!`);
                    res([
                        price_list,
                        time_list
                    ]);
                })
            }
        });

        App.Send({
            time: 1
        })
    });
}

module.exports = GetCache;