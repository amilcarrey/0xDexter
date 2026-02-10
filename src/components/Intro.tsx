import React from 'react';
import { Box, Text } from 'ink';
import { colors, dimensions } from '../theme.js';
import packageJson from '../../package.json';
import { getModelDisplayName } from './ModelSelector.js';

interface IntroProps {
  provider: string;
  model: string;
}

export function Intro({ provider, model }: IntroProps) {
  const { introWidth } = dimensions;
  const welcomeText = 'Welcome to Dexter DeFi';
  const versionText = ` v${packageJson.version}`;
  const fullText = welcomeText + versionText;
  const padding = Math.floor((introWidth - fullText.length - 2) / 2);

  return (
    <Box flexDirection="column" marginTop={2}>
      <Text color={colors.primary}>{'═'.repeat(introWidth)}</Text>
      <Text color={colors.primary}>
        ║{' '.repeat(Math.max(padding, 0))}
        <Text bold>{welcomeText}</Text>
        <Text color={colors.muted}>{versionText}</Text>
        {' '.repeat(Math.max(introWidth - fullText.length - Math.max(padding, 0) - 2, 0))}║
      </Text>
      <Text color={colors.primary}>{'═'.repeat(introWidth)}</Text>

      <Box marginTop={1}>
        <Text color={colors.primary} bold>
          {`
██████╗ ███████╗██╗  ██╗████████╗███████╗██████╗
██╔══██╗██╔════╝╚██╗██╔╝╚══██╔══╝██╔════╝██╔══██╗
██║  ██║█████╗   ╚███╔╝    ██║   █████╗  ██████╔╝
██║  ██║██╔══╝   ██╔██╗    ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██╔╝ ██╗   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝  ╚═╝`}
        </Text>
      </Box>

      <Box marginY={1} flexDirection="column">
        <Text>DeFi yield optimization powered by <Text color={colors.primary} bold>Turtle protocol</Text>.</Text>
        <Text color={colors.muted}>Model: <Text color={colors.primary}>{getModelDisplayName(model)}.</Text> Type /model to change.</Text>
      </Box>
    </Box>
  );
}
