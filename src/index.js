require("dotenv").config();
const { Client, Intents, MessageEmbed } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  allowedMentions: { parse: [], repliedUser: false },
  partials: ["MESSAGE", "CHANNEL", "REACTION", "USER"],
  restTimeOffset: 0
});
const fs = require("fs");

const prefix = ".";

client.on("ready", () => {
  console.log("Ready!");
  client.user.setPresence({
    activities: [
      {
        name: ".help",
        type: "PLAYING"
      }
    ]
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();
  if (command === "help") {
    const embed = new MessageEmbed()
      .setTitle("ヘルプ")
      .setDescription(
        `\`.help\` ヘルプを表示\n\`.ping\` Pingを表示\n\`.stock\` 在庫を表示\n\`.gen 排出するもの\` 排出する`
      )
      .setColor("RANDOM")
      .setTimestamp();
    message.reply({ embeds: [embed] });
  } else if (command === "ping") {
    const embed = new MessageEmbed()
      .setTitle("Ping")
      .setDescription(`${client.ws.ping}ms`)
      .setColor("RANDOM")
      .setTimestamp();
    message.reply({ embeds: [embed] });
  } else if (command === "stock") {
    const files = fs.readdirSync("../files").filter((file) => file.endsWith(".txt"));
    const zaikos = files.map((file) => fs.readFileSync(`../files/${file}`, "utf8").length);
    const embed = new MessageEmbed()
      .setTitle("在庫")
      .setDescription(`${files.map((x, i) => `${x}: ${zaikos[i]}`).join("\n")}`)
      .setColor("RANDOM")
      .setTimestamp();
    message.reply({ embeds: [embed] });
  } else if (command === "gen") {
    const files = fs.readdirSync("../files").filter((file) => file.endsWith(".txt"));
    const hosiimo = args.join(" ").toLowerCase();
    const file = files.find(x => x === hosiimo + ".txt");
    if (!file) {
      const embed = new MessageEmbed()
        .setTitle("エラー")
        .setDescription(`${hosiimo} は存在しません`)
        .setColor("RANDOM")
        .setTimestamp();
      message.reply({ embeds: [embed] });
      return;
    }
    const nakami = fs.readFileSync(`../files/${file}`, "utf8").split("\n")
    const ejected = nakami[0];
    nakami.splice(0, 1);
    message.member.send({ embeds: [new MessageEmbed().setTitle(`アカウント情報`).setFields([
      { name: "アカウント名/メールアドレス", value: ejected.split(":")[0] },
      { name: "パスワード", value: ejected.split(":")[1] }
    ]).setColor("RANDOM").setTimestamp()], content: `コピペ用: ${ejected}` })
    .then(() => {
      message.reply({
        embeds: [new MessageEmbed().setTitle(`DMに送信しました！`).setDescription("DMをチェックしてください").setColor("RANDOM").setTimestamp()]
      });
    })
    .catch(() => {
      message.reply({
        embeds: [new MessageEmbed().setTitle(`DMに送信できませんでした`).setDescription("DM設定を確認s似てください").setColor("RANDOM").setTimestamp()]
      });
    });
    fs.writeFileSync(`../files/${file}`, nakami.join("\n"));
  }
})