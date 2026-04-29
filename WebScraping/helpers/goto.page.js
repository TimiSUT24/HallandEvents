 async function gotoWithRetry(page,url,retries = 5){
            for(let i = 0; i < retries; i++){
                try{
                    await page.goto(url, { waitUntil: 'domcontentloaded',timeout: 90000 });
                    return;
                }catch(err){
                    console.log("Failed to load page", err.message);
                    if(i === retries - 1) throw err;
                    await page.waitForTimeout(3000);
                }
            }
        }

module.exports = { gotoWithRetry };