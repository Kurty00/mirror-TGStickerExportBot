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
        fs.mkdirSync(dir);
    }
    fs.writeFileSync(dir+"stickerset.json", JSON.stringify(set))
    var links = [];
    for (let sticker of set.stickers) {
        let link = await ctx.telegram.getFileLink(sticker.file_id);
        links.push(link)
        await download(link, set.name)
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


function download(url, directory) {

    const dir = "files/" + directory + "/";
    const path = dir + (url + "").split("/").at(-1);

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }

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
}