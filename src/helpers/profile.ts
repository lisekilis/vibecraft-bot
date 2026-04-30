import { APIEmbed, APIEmbedFooter, APIEmbedImage, APIUser, EmbedType } from 'discord-api-types/v10';
import { XboxUserData } from '../types';

export function createProfileEmbed(account: XboxUserData, discordUser: APIUser): APIEmbed {
	let image: APIEmbedImage | undefined;
	let thumbnail: APIEmbedImage | undefined;
	let footer: APIEmbedFooter | undefined;
	const title = account.minecraftAccount ? `${account.gameDisplayName} (${account.minecraftAccount.name})` : account.gameDisplayName;
	if (account.minecraftAccount) {
		const renderedSkin = {
			relaxedUrl: `https://starlightskins.lunareclipse.studio/relaxed/${account.minecraftAccount.id}/full`,
			headUrl: `https://starlightskins.lunareclipse.studio/head/${account.minecraftAccount.id}`,
		};

		image = { url: renderedSkin.relaxedUrl };
		thumbnail = { url: renderedSkin.headUrl };
	} else {
		image = undefined;
		thumbnail = { url: account.gameProfilePicture };
	}

	const embed: APIEmbed = {
		author: {
			name: discordUser.global_name || discordUser.username,
			icon_url: discordUser.avatar ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined,
			url: `discord://-/users/${discordUser.id}`,
		},
		title,
		image,
		thumbnail,
		footer,
		type: EmbedType.Rich,
	};

	return embed;
}
