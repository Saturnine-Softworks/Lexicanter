# Sass Stylesheets
The stylesheets in this folder are the source stylesheets
for the app. The CSS stylesheets found in the [styles](../styles/)
folder are what the app actually *reads* at runtime: they are
preprocessed from the source files located here.

## Structure
- [`index.sass`](index.sass) defines the base layout styles for the desktop app.
- [`orbits.sass`](orbits.sass) holds all of the styles for the file loading orbit wheel decoration.
- [`theme_styles.sass`](theme_styles.sass) applies all of a theme's color styles.
- [`html_export.sass`](html_export.sass) overrides some of the layout styles for HTML exporting.
- [`font_faces.sass`](font_faces.sass) loads in the typefaces Noto and Gentium.
- All of the `.scss` files define the settings for their respective themes by overriding default
  variables set in `orbits.sass` and `theme_styles.sass`.
