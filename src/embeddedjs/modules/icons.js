/**
 * Icons
 *
 * Re-exports the full icon library as named exports and provides the
 * IconLabel template.  Import individual symbols from this module rather
 * than from "modules/icons/library" directly so future changes to the
 * underlying file only need updating here.
 *
 * Usage:
 *   import { IconLabel } from "modules/icons";
 *   import { battery, batteryFull } from "modules/icons";
 *
 * @module icons
 *
 * @author    Cory Hughart <cory@coryhughart.com>
 * @copyright 2026 Cory Hughart
 * @license   https://www.gnu.org/licenses/gpl-3.0.html GPL-3.0-or-later
 * @link      https://cr0ybot.com/project/pebble-watchface-carbon
 */

import assets from "assets";

export * from "./icons/library";

const iconStyle = new Style(assets.styles.icons);

/**
 * Label template with the icon font style baked in.
 *
 * Usage: IconLabel($, { string: battery })
 */
export const IconLabel = Label.template($ => ({
	style: iconStyle,
}));
