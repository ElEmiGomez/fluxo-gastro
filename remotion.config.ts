import { enableTailwind } from '@remotion/tailwind';
import { Config } from '@remotion/cli/config';

Config.overrideWebpackConfig((currentConfiguration) => {
  return enableTailwind(currentConfiguration);
});

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
Config.setHighContrast(false);
Config.setPublicLicenseKey('free-license');
