import {
    alertEmbedThumbnailUrl,
    BotActionOptions,
    channelFullPath,
    defaultEmbedColor,
    defaultEmbedThumbnailUrl,
    teamsEmbedColor,
    teamsEmbedTitle,
    timeToAlert
} from "./Api";
import {EmbedField, Queue, queuedPlayers} from "./Queue";
import {MessageEmbed, StringResolvable} from "discord.js";

type AlertEmbedProps = {
    color: StringResolvable,
    title: StringResolvable,
    timestamp: Date,
    thumbnail: StringResolvable,
    alertField: EmbedField
}

const getAlertEmbedProps = (): AlertEmbedProps => {
    //TODO: make name and value customizable
    const name: string = `If you do not remove and re-add your reaction within 15 minutes of this message, you may be automatically removed from the queue.`;
    const value: string = `If you wish to reset your queue idle time, please go [here](${channelFullPath}) to remove and replace your reaction.\nOtherwise, feel free to re-queue whenever! :)`
    return {
        color: teamsEmbedColor ? teamsEmbedColor : defaultEmbedColor,
        title: teamsEmbedTitle,
        timestamp: new Date(),
        thumbnail: alertEmbedThumbnailUrl ? alertEmbedThumbnailUrl : defaultEmbedThumbnailUrl,
        alertField: {name: name, value: value, inline: false}
    };
};

const buildAlertEmbed = (props: AlertEmbedProps): MessageEmbed => {
    return new MessageEmbed()
        .setColor(props.color)
        .setTitle(props.title)
        .setTimestamp(props.timestamp)
        .setThumbnail(props.thumbnail)
        .addFields(props.alertField)

};

export const Alerts = () => {
    queuedPlayers && queuedPlayers.forEach(qp => {
        if (qp.warned) {
            queuedPlayers.splice(queuedPlayers.indexOf(qp), 1);
            Queue(BotActionOptions.update, undefined, undefined, qp.user);
        } else if ((new Date().getTime() - timeToAlert.getTime()) > qp.timestamp.getTime()) {
            qp.user.send(buildAlertEmbed(getAlertEmbedProps())).then(
                () => console.log(`${qp.user} was alerted they may be removed from queue at ${new Date()}`)
            );
            qp.warned = true;
        }
    })
}