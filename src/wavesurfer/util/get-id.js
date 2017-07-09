/* Creative Commons Attribution 3.0 Unported License.
 * https://github.com/katspaugh/wavesurfer.js
 */

/**
 * Get a random prefixed ID
 *
 * @returns {String} Random ID
 */
export default function getId () {
    return 'wavesurfer_' + Math.random().toString(32).substring(2);
}
