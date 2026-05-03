/**
 * Icons
 *
 * Provides the `IconLabel` template — a Label with the IcoMoon icon font
 * style pre-applied.  Use Unicode codepoint strings as the `string` value.
 * See ICONS.md for the full codepoint reference.
 *
 * Usage:
 *   import { IconLabel } from "modules/icons";
 *   IconLabel.template($ => ({ string: "\uF346" }))  // battery
 *   label.string = "\uF38E"; // battery-charging
 *
 * @module icons
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import { styles } from "assets";

/**
 * Label template with the icon font style baked in.
 *
 * Usage: IconLabel($, { string: "\uF346" })  // see ICONS.md for codepoints
 */
export const IconLabel = Label.template($ => ({
	style: styles.topBarIcons,
}));
