/**
 * Placeholder widget
 *
 * Debug stand-in for widget slots. Supports icon-only, text-only,
 * or icon+text output so layout and style combinations can be tested.
 *
 * Config:
 *   icon - icon glyph/codepoint string
 *   text - text payload
 *
 * @module widgets/placeholder
 * @todo Remove before release.
 */

import Widget from "modules/widget";
import { styles } from "assets";

const PlaceholderTemplate = Row.template($ => {
	const hasIcon = typeof $.icon === "string" && $.icon.length > 0;
	const hasText = typeof $.text === "string" && $.text.length > 0;
	const iconString = hasIcon ? $.icon : "";
	const textString = hasText ? $.text : "";

	const slotW = $.slotWidth ?? 48;
	const pad = $.slotPadding ?? 3;
	const iconW = hasIcon ? 20 : 0;
	const gap = hasIcon && hasText ? 2 : 0;
	const textW = hasText ? Math.max(14, slotW - iconW - gap - (pad * 2)) : 0;
	const contentW = iconW + gap + textW;

	let left = pad;
	if ($.slotAlign === "center")
		left = Math.max(0, Math.floor((slotW - contentW) / 2));
	else if ($.slotAlign === "right")
		left = Math.max(0, slotW - pad - contentW);

	return {
		left,
		width: contentW,
		contents: [
			Label($, {
				width: iconW,
				style: $.iconStyle ?? styles.topBarIcons,
				string: iconString,
			}),
			Label($, {
				width: textW,
				style: $.textStyle ?? styles.topBarText,
				string: textString,
			}),
		],
	};
});

class PlaceholderWidget extends Widget {
	get Template() { return PlaceholderTemplate; }
}

Object.freeze(PlaceholderWidget);
export default PlaceholderWidget;
