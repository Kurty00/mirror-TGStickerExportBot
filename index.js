import fs from 'fs';
import https from 'https';
import AdmZip from 'adm-zip';
import { Telegraf, Telegram, Input } from 'telegraf';
import { message } from 'telegraf/filters';

const bot = new Telegraf(process.env.BOT_TOKEN)

bot.command('quit', async (ctx) => {
    // Explicit usage
    await ctx.telegram.leaveChat(ctx.message.chat.id)

    // Using context shortcut
    await ctx.leaveChat()
})

bot.on(message('sticker'), async (ctx) => {
    // Explicit usage

    console.log(ctx)
    // Using context shortcut
    console.log(ctx.message.sticker)
    let set = await ctx.telegram.getStickerSet(ctx.message.sticker.set_name);
    let dir = "files/" + ctx.message.sticker.set_name + "/";
    
    if (!fs.existsSync(dir)) {
        console.log(`New sticker set - creating directory`)
        fs.mkdirSync(dir);
    }
    if (fs.existsSync(dir+set.name+".zip")) {
        console.log(`Found existing pack.zip - deleting`)
        fs.unlinkSync(dir+set.name+".zip");
    }
    fs.writeFileSync(dir+"stickerset.json", JSON.stringify(set))
    var links = [];
    for (let sticker of set.stickers) {
        let link = await ctx.telegram.getFileLink(sticker.file_id);
        links.push(link)
        await download(link, set.name, sticker.file_id)
    }
    
    let z = new AdmZip();
    z.addLocalFolder(dir);
    let zfile = z.toBuffer();
    
    let zfilename = dir+set.name+".zip";
    await z.writeZip(zfilename);
    await ctx.replyWithDocument(Input.fromLocalFile(zfilename), {caption: set.title});
})

bot.on('callback_query', async (ctx) => {
    // Explicit usage
    await ctx.telegram.answerCbQuery(ctx.callbackQuery.id)

    // Using context shortcut
    await ctx.answerCbQuery()
})

bot.on('inline_query', async (ctx) => {
    const result = []
    // Explicit usage
    await ctx.telegram.answerInlineQuery(ctx.inlineQuery.id, result)

    // Using context shortcut
    await ctx.answerInlineQuery(result)
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))


function download(url, directory, name) {

    const dir = "files/" + directory + "/";
    const path = dir + name + url.split(".").at(-1);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

    if(!fs.existsSync(path)) {
        https.get(url, (res) => {
            console.info(`Download from ${url} started`)

            const writeStream = fs.createWriteStream(path);

            res.pipe(writeStream);

            writeStream.on("finish", () => {
                writeStream.close();
                console.log(`Download ${path} completed`);
            });
            writeStream.on("error", (e) => {
                console.log(`Download ${path} errored: ${e}`);
                writeStream.destroy();
            });
        });
    } else {
        console.log(`Skipped download of ${path} - File exists`)
    } 
}