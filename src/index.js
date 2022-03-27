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
/** @type {WeakMap<string, number>} */
const cooldowns = new Map();
const config = require("../config/config.js");

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
    const files = fs.readdirSync("./files").filter((file) => file.endsWith(".txt"));
    const zaikos = files.map((file) => fs.readFileSync(`./files/${file}`, "utf8").split("\n").length);
    const embed = new MessageEmbed()
      .setTitle("在庫")
      .setDescription(`${files.map((x, i) => `${x.replace(/\.txt$/, "")}: ${zaikos[i]}`).join("\n")}`)
      .setColor("RANDOM")
      .setTimestamp();
    message.reply({ embeds: [embed] });
  } else if (command === "gen") {
    if (!config.usableChannelId.includes(message.channel.id)) {
      const embed = new MessageEmbed()
        .setTitle("エラー")
        .setDescription(`このチャンネルでは使用できません`)
        .setColor("RANDOM")
        .setTimestamp();
      message.reply({ embeds: [embed] });
      return;
    }
    const files = fs.readdirSync("./files").filter((file) => file.endsWith(".txt"));
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
    const nakami = fs.readFileSync(`./files/${file}`, "utf8").split("\n")
    const ejected = nakami[0];
    if (!ejected) {
      const embed = new MessageEmbed()
        .setTitle("エラー")
        .setDescription(`${hosiimo} の在庫はありません`)
        .setColor("RANDOM")
        .setTimestamp();
      message.reply({ embeds: [embed] });
      return;
    }
    if (cooldowns.has(message.author.id)) {
      const time = cooldowns.get(message.author.id);
      const now = Date.now();
      const premiumUsers = fs.readFileSync("./config/premium.txt", "utf8").split("\n");
      if (premiumUsers.includes(message.author.id)) {
        if ((now - time) < config.premiumUserCooldown) {
          const embed = new MessageEmbed()
            .setTitle("エラー")
            .setDescription(`あなたはまだクールダウン中です。\n${(config.premiumUserCooldown - (now - time)) / 1000}秒後に再度実行してください。`)
            .setColor("RANDOM")
            .setTimestamp();
          message.reply({ embeds: [embed] });
          return;
        }
      } else {
        if ((now - time) < config.normalUserCooldown) {
          const embed = new MessageEmbed()
            .setTitle("エラー")
            .setDescription(`あなたはまだクールダウン中です。\n${(config.normalUserCooldown - (now - time)) / 1000}秒後に再度実行してください。`)
            .setColor("RANDOM")
            .setTimestamp();
          message.reply({ embeds: [embed] });
          return;
        }
      }
    }
    cooldowns.set(message.author.id, Date.now());
    nakami.splice(0, 1);
    message.member.send({ embeds: [new MessageEmbed().setTitle(`アカウント情報`).setFields([
      { name: "アカウント名/メールアドレス", value: ejected.split(":")[0] },
      { name: "パスワード", value: ejected.split(":")[1] }
    ]).setColor("RANDOM").setTimestamp()], content: `コピペ用: ${ejected}` })
    .then(() => {
      message.reply({
        embeds: [new MessageEmbed().setTitle(`DMに送信しました！`).setDescription("DMをチェックしてください").setColor("RANDOM").setTimestamp()]
      });
      client.channels.cache.get(config.logChannelId).send({ embeds: [
        { title: "排出", fields: [ { name: "ユーザー", value: `${message.author.tag}/${message.author.id}`}, { name: "排出物", value: `${hosiimo}/${ejected}`} ]}
      ] })
      fs.writeFileSync(`./files/${file}`, nakami.join("\n"));
    })
    .catch((e) => {
      console.log(e)
      message.reply({
        embeds: [new MessageEmbed().setTitle(`DMに送信できませんでした`).setDescription("DM設定を確認s似てください").setColor("RANDOM").setTimestamp()]
      });
    });
    
  }
});

client.login(process.env.BOT_TOKEN);
