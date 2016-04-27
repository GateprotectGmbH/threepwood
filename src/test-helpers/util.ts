/**
 * Collection of helpers that may be useful when unit-testing components
 */
export default class Util {

  /**
   * Get the number of md-buttons found in the given html fragment
   *
   * @param haystack
   *
   * @returns {number}
   */
  static getMdButtonCount(haystack:string):number {
    return Util.getMdButtons(haystack).length;
  }

  /**
   * Check whether the given html contains a single md-button with the given label.
   * Consider using getMdButtons and getMdButtonLabel because they allow your
   * tests to produce more meaningful output
   *
   * @param haystack html code to search for buttons
   * @param needle button label you're looking for
   * @param caseSensitive duh
   *
   * @returns {boolean}
   */
  static hasSingleMdButtonWithLabel(haystack:string, needle:string, caseSensitive = true):boolean {
    const buttons = Util.getMdButtonsWithLabel(haystack, needle, caseSensitive);
    return buttons.length === 1;
  }

  /**
   * Get all md-buttons form haystack that match the given regex.
   * Consider using getMdButtons and getMdButtonLabel because they allow your
   * tests to produce more meaningful output
   *
   * @param haystack html code to search for buttons
   * @param needle button label you're looking for
   * @param caseSensitive duh
   *
   * @returns {Array} array of found buttons (may be empty)
   */
  static getMdButtonsWithLabel(haystack:string, needle:string, caseSensitive = true):string[] {
    const matchedButtons = [];
    const buttons = Util.getMdButtons(haystack);
    let buttonLabel;

    for (let i = 0; i < buttons.length; i++) {
      buttonLabel = Util.getMdButtonLabel(buttons[i]);
      if (buttonLabel && (buttonLabel === needle || (caseSensitive && buttonLabel.toUpperCase() === needle.toUpperCase()))) {
        matchedButtons.push(buttons[i]);
      }
    }

    return matchedButtons;
  }

  /**
   * Extract the label from the html code of an md-button
   *
   * @param buttonHtml
   *
   * @returns {string|null} Label as string or NULL if nothing found
   */
  static getMdButtonLabel(buttonHtml:string):string {
    let matches = buttonHtml.match(new RegExp(".*>(.*?)</span></button>"));
    if (matches && matches[1]) {
      return matches[1];
    } else {
      //noinspection TsLint
      return null;
    }
  }

  /**
   * Returns a list of the md-buttons found within the given html.
   *
   * @param haystack
   *
   * @returns {RegExpMatchArray|Array} html making up each found button
   */
  static getMdButtons(haystack:string):string[] {
    const pattern = ".*<button class=\".*?md-button.*?><span .*?>.*?<\/span><\/button>.*";
    const matches = haystack.match(new RegExp(pattern, 'g'));
    return matches || [];
  }

}
