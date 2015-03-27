# Deviations from the original PhET simulation **_and the reasons for them_**

Note that I do not list nominal changes like cosmetic differences (e.g., the addition of clouds and sky gradient).

1. **Relocation of "expression evaluator" from the top menu (Special Features > Expression Evaluator) to its new location near the position slider and renaming to "use function":**

    The first reason I moved it was because the function controls the *position* over time, just like the position value text box and position value slider; it only makes sense that they'd be grouped.  The second is that, logically, the use of a custom position function (what I renamed the expression evaluator to) negates the use of the position slider and text box&mdash;it takes over control of position from manual user input to a time-based mathematical function&mdash;and giving the user the impression that he or she can continue to use the slider and text box only causes frustration and confusion.  And because it is actually a proper, determinant mathematical function, I chose to use this terminology instead since the time-based math function is more universally understood than the computer-sciencey "expression."
2. **Disabling of playback and recording controls on the "Intro" tab:**

    The most prominant reason was simply that these controls proved a barrier to entry for the user.  Because the purpose of the first tab is to simply be an introduction to what the simulation is trying to portray and how to use it, we decided to simplify the controls and get the user started right away.  It is also very difficult to see what is happening when the user hits the "play" button in the original, which actually starts it *recording*, since the intro tab does not show the recorded data in the form of graphs.  It makes much more sense to limit the recording functionality to the "Charts" tab where the user gets more visual feedback about the recording and playing back.  (I also addressed the iconographical confusion of having a "play" button that actually records by using a different icon in the record button than the one for the play button.)
3. **Omission of the small play buttons from the Charts tab:**

    In the original simulation, the charts tab had an additional play button that appeared next to a particular variable as the user was manipulating it.  Because this was done only in the Charts tab and not the Introduction tab, where the user is made acquainted with the controls and how the simulation works, I would argue that this extra clue for the user that the simulation is paused&mdash;and therefore changes to the variable will have no immediate effect&mdash;is superfluous.  In the original simulation the user would be more likely to figure out how it works in the less complicated Introduction tab, which leads me to believe that its primary purpose was to show which variable is the *driving variable* at any given time.  This marking of the driving variable I addressed with an icon instead in the new implementation.  Instead of the button, which takes up space that we end up using with the larger, more modern UI controls, we simply have a compass icon that appears next to the variable that is currently driving the simulation.  One could argue, however, that the compass icon's meaning is too mysterious, and I would respond that the play/pause button gave no more clue about this functionality than an icon, and the user would have to recognize a pattern in the software's behavior before he or she could deduce the icon or button's functionality anyway.
4. **Relocation of sound toggle and addition of "low" option:**

    In an attempt to group UI controls in a more thematic way, the sound toggle was moved away from the bottom record/playback control panel at the bottom of the screen.  It turned out that removing the sound-toggling checkbox from that toolbar gave the toolbar a very specific function; every control in it shared a similar purpose in that they were related to playback and recording.  The sound button, too, was nowhere near the apparent source of the sound&mdash;the collision of the man with the walls.  Therefore, in our new version of the sim, I chose to place the sound toggle on the top near the right-most wall.  I also observed that when the sound was on (the default) and the crash occurred, the sound was very startling and painful in cases where the user was wearing headphones.  This is because the sound was always played at maximum volume.  In order to maintain the integrity of the original sim but still address that definite problem, I made the sound play at a lower volume by default, which means I also introduced a third volume setting between On and Off.