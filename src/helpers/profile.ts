import { APIEmbed, APIEmbedFooter, APIEmbedImage, APIUser, EmbedType, RouteBases } from 'discord-api-types/v10';
import { XboxUserData } from '../types';

export function createProfileEmbed(account: XboxUserData, discordUser: APIUser): APIEmbed {
	let image: APIEmbedImage | undefined;
	let thumbnail: APIEmbedImage | undefined;
	let footer: APIEmbedFooter | undefined;
	const title = account.minecraftAccount ? `${account.gameDisplayName} (${account.minecraftAccount.name})` : account.gameDisplayName;

	console.log('Creating profile embed for account:', JSON.stringify(account));

	if (account.minecraftAccount) {
		console.log('Account has Minecraft account, rendering skin');
		const renderedSkin = {
			relaxedUrl: `https://starlightskins.lunareclipse.studio/relaxed/${account.minecraftAccount.id}/full`,
			headUrl: `https://starlightskins.lunareclipse.studio/head/${account.minecraftAccount.id}`,
		};

		image = { url: renderedSkin.relaxedUrl };
		thumbnail = { url: renderedSkin.headUrl };
	} else {
		console.log('Account has no Minecraft account, using game profile picture');
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
		type: EmbedType.Rich,
	};

	return embed;
}
