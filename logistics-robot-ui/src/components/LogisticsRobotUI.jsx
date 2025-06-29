import React, { useState, useEffect } from 'react';
import { Send, Package, Bot, History, Zap, Archive } from 'lucide-react';

const LogisticsRobotUI = () => {
  // Grid configuration
  const GRID_SIZE = 10;
  const CELL_SIZE = 60;

  // Initialize grid with predefined locations
  const initializeGrid = () => {
    const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    
    // Add some predefined locations
    const locations = [
      { row: 1, col: 2, type: 'shelf', label: 'Shelf A3', items: 3 },
      { row: 3, col: 5, type: 'shelf', label: 'Shelf B2', items: 2 },
      { row: 6, col: 8, type: 'zone', label: 'Zone B', items: 0 },
      { row: 8, col: 1, type: 'charging', label: 'Charging Station', items: 0 },
      { row: 0, col: 0, type: 'zone', label: 'Zone A', items: 1 },
      { row: 4, col: 7, type: 'shelf', label: 'Shelf C1', items: 4 },
    ];

    locations.forEach(({ row, col, type, label, items }) => {
      grid[row][col] = { type, label, items };
    });

    return grid;
  };

  // State management
  const [grid, setGrid] = useState(initializeGrid);
  const [robotPosition, setRobotPosition] = useState({ row: 0, col: 0 });
  const [robotCarrying, setRobotCarrying] = useState(0);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedCommand, setParsedCommand] = useState(null);
  const [commandHistory, setCommandHistory] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Robot is ready for commands');

  // Animation helper function
  const animateRobot = async (targetRow, targetCol, duration = 2000) => {
    setIsAnimating(true);
    const startRow = robotPosition.row;
    const startCol = robotPosition.col;
    const steps = 20;
    const stepDuration = duration / steps;

    for (let i = 0; i <= steps; i++) {
      const progress = i / steps;
      const currentRow = Math.round(startRow + (targetRow - startRow) * progress);
      const currentCol = Math.round(startCol + (targetCol - startCol) * progress);
      
      setRobotPosition({ row: currentRow, col: currentCol });
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
    
    setIsAnimating(false);
  };

  // Find location on grid by label
  const findLocationByLabel = (label) => {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (grid[row][col]?.label === label) {
          return { row, col };
        }
      }
    }
    return null;
  };

  // Execute robot action based on parsed command
  const executeRobotAction = async (parsedCmd) => {
    if (!parsedCmd.valid_command || parsedCmd.action === 'UNKNOWN') {
      setStatusMessage('Invalid command - robot cannot execute');
      return;
    }

    let targetLocation = null;
    let secondaryLocation = null;

    switch (parsedCmd.action) {
      case 'MOVE':
        if (parsedCmd.source && parsedCmd.destination) {
          // Full move: source -> destination
          targetLocation = findLocationByLabel(parsedCmd.source);
          secondaryLocation = findLocationByLabel(parsedCmd.destination);
          setStatusMessage(`Moving ${parsedCmd.quantity || 'items'} from ${parsedCmd.source} to ${parsedCmd.destination}`);
        } else if (parsedCmd.destination) {
          // Simple move: just go to destination
          targetLocation = findLocationByLabel(parsedCmd.destination);
          setStatusMessage(`Moving to ${parsedCmd.destination}`);
        } else if (parsedCmd.source) {
          // Move to source location
          targetLocation = findLocationByLabel(parsedCmd.source);
          setStatusMessage(`Moving to ${parsedCmd.source}`);
        }
        break;
      case 'GET':
        if (parsedCmd.source) {
          targetLocation = findLocationByLabel(parsedCmd.source);
          setStatusMessage(`Getting items from ${parsedCmd.source}`);
        }
        break;
      case 'DELIVER':
        if (parsedCmd.destination) {
          targetLocation = findLocationByLabel(parsedCmd.destination);
          setStatusMessage(`Delivering items to ${parsedCmd.destination}`);
        }
        break;
      case 'CHARGE':
        targetLocation = findLocationByLabel('Charging Station');
        setStatusMessage('Moving to charging station');
        break;
    }

    if (!targetLocation) {
      setStatusMessage('Location not found on grid');
      return;
    }

    // Execute the movement
    if (parsedCmd.action === 'MOVE' && parsedCmd.source && parsedCmd.destination && parsedCmd.quantity) {
      // Multi-step move with item transfer
      
      // Step 1: Move to source and pick up items
      await animateRobot(targetLocation.row, targetLocation.col);
      
      // Pick up items
      const sourceLocation = targetLocation;
      const sourceCell = grid[sourceLocation.row][sourceLocation.col];
      if (sourceCell && sourceCell.items >= parsedCmd.quantity) {
        setRobotCarrying(parsedCmd.quantity);
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[sourceLocation.row][sourceLocation.col] = {
            ...newGrid[sourceLocation.row][sourceLocation.col],
            items: newGrid[sourceLocation.row][sourceLocation.col].items - parsedCmd.quantity
          };
          return newGrid;
        });
        setStatusMessage(`Picked up ${parsedCmd.quantity} items, moving to ${parsedCmd.destination}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Step 2: Move to destination and drop off items
      if (secondaryLocation) {
        await animateRobot(secondaryLocation.row, secondaryLocation.col);
        
        // Drop off items
        setGrid(prevGrid => {
          const newGrid = [...prevGrid];
          newGrid[secondaryLocation.row][secondaryLocation.col] = {
            ...newGrid[secondaryLocation.row][secondaryLocation.col],
            items: newGrid[secondaryLocation.row][secondaryLocation.col].items + parsedCmd.quantity
          };
          return newGrid;
        });
        setRobotCarrying(0);
        setStatusMessage(`Delivered ${parsedCmd.quantity} items to ${parsedCmd.destination}`);
      }
    } else {
      // Simple movement
      await animateRobot(targetLocation.row, targetLocation.col);
      setStatusMessage(`Arrived at ${grid[targetLocation.row][targetLocation.col]?.label || 'location'}`);
    }
  };

  // Handle command submission
  const handleSubmitCommand = async () => {
    if (!command.trim() || isLoading) return;

    setIsLoading(true);
    try {
      // Replace with your actual FastAPI endpoint
      const response = await fetch('http://localhost:8000/parse-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ command: command.trim() }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setParsedCommand(result);
      
      // Add to history
      const historyEntry = {
        id: Date.now(),
        command: command.trim(),
        result,
        timestamp: new Date().toLocaleTimeString(),
      };
      setCommandHistory(prev => [historyEntry, ...prev.slice(0, 9)]);

      // Execute robot action
      await executeRobotAction(result);
      
      setCommand('');
    } catch (error) {
      console.error('Error:', error);
      setStatusMessage('Error: Could not connect to backend server');
      // For demo purposes, create a mock response if backend is not available
      const mockResult = {
        action: 'UNKNOWN',
        quantity: null,
        item_id: null,
        source: null,
        destination: null,
        valid_command: false
      };
      setParsedCommand(mockResult);
    } finally {
      setIsLoading(false);
    }
  };

  // Get cell content
  const getCellContent = (row, col) => {
    const cellData = grid[row][col];
    const isRobotHere = robotPosition.row === row && robotPosition.col === col;

    return (
      <div className="relative w-full h-full">
        {/* Location background */}
        {cellData && (
          <div className={`
            absolute inset-0 rounded-md opacity-60
            ${cellData.type === 'shelf' ? 'bg-blue-200' : ''}
            ${cellData.type === 'zone' ? 'bg-green-200' : ''}
            ${cellData.type === 'charging' ? 'bg-yellow-200' : ''}
          `} />
        )}
        
        {/* Items */}
        {cellData?.items > 0 && (
          <div className="absolute top-1 right-1 flex items-center">
            <Package size={12} className="text-orange-600" />
            <span className="text-xs font-bold text-orange-800 ml-1">{cellData.items}</span>
          </div>
        )}

        {/* Robot */}
        {isRobotHere && (
          <div className={`
            absolute inset-2 bg-red-500 rounded-full flex items-center justify-center
            transition-all duration-300 ${isAnimating ? 'animate-pulse' : 'hover:scale-110'}
            ${robotCarrying > 0 ? 'ring-4 ring-orange-400 ring-opacity-60' : ''}
          `}>
            <Bot size={20} className="text-white" />
            {robotCarrying > 0 && (
              <div className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {robotCarrying}
              </div>
            )}
          </div>
        )}

        {/* Location label */}
        {cellData && (
          <div className="absolute bottom-0 left-0 right-0 text-xs font-medium text-center bg-white bg-opacity-80 rounded-b-md p-1">
            {cellData.label}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Logistics Robot Controller</h1>
          <p className="text-slate-600">Control your warehouse robot with natural language commands</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Grid Area */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                <Archive className="mr-2" size={20} />
                Warehouse Grid
              </h2>
              
              {/* Grid */}
              <div 
                className="grid gap-1 mx-auto border-2 border-slate-300 rounded-lg p-4 bg-slate-50"
                style={{ 
                  gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
                  width: 'fit-content'
                }}
              >
                {Array(GRID_SIZE).fill(null).map((_, row) =>
                  Array(GRID_SIZE).fill(null).map((_, col) => (
                    <div
                      key={`${row}-${col}`}
                      className="border border-slate-200 bg-white rounded-md flex items-center justify-center relative hover:bg-slate-50 transition-colors"
                      style={{ width: CELL_SIZE, height: CELL_SIZE }}
                    >
                      {getCellContent(row, col)}
                    </div>
                  ))
                )}
              </div>

              {/* Robot Status */}
              <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bot size={16} className="text-red-500 mr-2" />
                    <span className="font-medium text-slate-700">Robot Status:</span>
                  </div>
                  <div className={`text-sm font-medium ${isAnimating ? 'text-blue-600' : 'text-green-600'}`}>
                    {isAnimating ? 'Moving...' : 'Ready'}
                  </div>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                  Position: ({robotPosition.row}, {robotPosition.col})
                  {robotCarrying > 0 && (
                    <span className="ml-4 text-orange-600 font-medium">
                      Carrying: {robotCarrying} boxes
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-slate-600">{statusMessage}</div>
              </div>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-200 rounded mr-2"></div>
                  <span>Shelf</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-200 rounded mr-2"></div>
                  <span>Zone</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-200 rounded mr-2"></div>
                  <span>Charging</span>
                </div>
                <div className="flex items-center">
                  <Bot size={16} className="text-red-500 mr-2" />
                  <span>Robot</span>
                </div>
                <div className="flex items-center">
                  <Package size={16} className="text-orange-600 mr-2" />
                  <span>Items</span>
                </div>
              </div>
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Command Input */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Command Interface</h2>
              
              <div className="space-y-4">
                <textarea
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  placeholder="Enter natural language command (e.g., 'Move 5 boxes from Shelf A3 to Zone B')"
                  className="w-full p-3 border border-slate-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  disabled={isLoading || isAnimating}
                />
                
                <button
                  onClick={handleSubmitCommand}
                  disabled={!command.trim() || isLoading || isAnimating}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      Send Command
                    </>
                  )}
                </button>
              </div>

              {/* Example Commands */}
              <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-medium text-slate-700 mb-2">Example Commands:</h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>• "Move 3 boxes from Shelf A3 to Zone B"</li>
                  <li>• "Go to charging station"</li>
                  <li>• "Get items from Shelf B2"</li>
                  <li>• "Deliver packages to Zone A"</li>
                </ul>
              </div>
            </div>

            {/* Parsed Command Display */}
            {parsedCommand && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Parsed Command</h2>
                <div className="bg-slate-100 rounded-lg p-4">
                  <pre className="text-sm text-slate-700 whitespace-pre-wrap">
                    {JSON.stringify(parsedCommand, null, 2)}
                  </pre>
                </div>
                <div className={`mt-2 text-sm font-medium ${
                  parsedCommand.valid_command ? 'text-green-600' : 'text-red-600'
                }`}>
                  {parsedCommand.valid_command ? '✓ Valid Command' : '✗ Invalid Command'}
                </div>
              </div>
            )}

            {/* Command History */}
            {commandHistory.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-slate-800 mb-4 flex items-center">
                  <History size={20} className="mr-2" />
                  Command History
                </h2>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {commandHistory.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-3">
                      <div className="text-sm font-medium text-slate-800 mb-1">
                        {entry.command}
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        {entry.timestamp}
                      </div>
                      <div className={`text-xs ${
                        entry.result.valid_command ? 'text-green-600' : 'text-red-600'
                      }`}>
                        Action: {entry.result.action}
                        {entry.result.quantity && ` | Quantity: ${entry.result.quantity}`}
                        {entry.result.source && ` | From: ${entry.result.source}`}
                        {entry.result.destination && ` | To: ${entry.result.destination}`}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsRobotUI;