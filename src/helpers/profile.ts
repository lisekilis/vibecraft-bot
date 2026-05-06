import { APIEmbed, APIEmbedFooter, APIEmbedImage, APIUser, RouteBases } from 'discord-api-types/v10';
import { XboxUserData } from '../types';

export function createProfileEmbed(account: XboxUserData, discordUser: APIUser): APIEmbed {
	let image: APIEmbedImage | undefined;
	let thumbnail: APIEmbedImage | undefined;
	let footer: APIEmbedFooter | undefined;
	const title = account.minecraftAccount ? account.minecraftAccount.name : account.gameDisplayName;

	if (account.minecraftAccount) {
		const renderedSkin = {
			relaxedUrl: `https://starlightskins.lunareclipse.studio/render/relaxing/${account.minecraftAccount.id}/full`,
			headUrl: `https://starlightskins.lunareclipse.studio/render/head/${account.minecraftAccount.id}/full`,
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
			icon_url: discordUser.avatar ? RouteBases.cdn + `/avatars/${discordUser.id}/${discordUser.avatar}.png` : undefined,
			url: `https://discord.com/users/${discordUser.id}`,
		},
		title,
		image,
		thumbnail,
		footer,
	};

	return embed;
}
