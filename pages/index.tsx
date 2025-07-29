import React, { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import GameScreen from '@/components/GameScreen';
import { GameState } from '@/lib/voteStore';

interface HomeProps {
  voteUrl: string;
  initialGameState: GameState;
}

export default function Home({ voteUrl, initialGameState }: HomeProps) {
  return (
    <>
      <Head>
        <title>RoastBot - Main Game Screen</title>
        <meta name="description" content="Host the epic roast battle between humans and AI" />
      </Head>
      <GameScreen initialGameState={initialGameState} voteUrl={voteUrl} />
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req }) => {
  // Get the current host and construct the vote URL
  const host = req.headers.host || 'localhost:3000';
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const voteUrl = `${protocol}://${host}/vote`;

  // Fetch initial game state
  let initialGameState: GameState = {
    currentRound: 1,
    maxRounds: 3,
    topic: '',
    humanRoast: '',
    aiRoast: '',
    votes: { human: 0, ai: 0 },
    roundWinners: [],
    isVotingOpen: false,
    gameStarted: false
  };

  try {
    // Try to fetch current game state from API
    const response = await fetch(`${protocol}://${host}/api/get-votes`);
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        initialGameState = data.gameState;
      }
    }
  } catch (error) {
    console.error('Error fetching initial game state:', error);
    // Use default state if API is not available
  }

  return {
    props: {
      voteUrl,
      initialGameState
    }
  };
}; 