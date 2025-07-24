import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const AIChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");

  // Dummy responses for Jiu-Jitsu athlete reports
  const dummyResponses = [
    "Based on your recent training data, your guard retention has improved by 23% over the last month. Your closed guard sweeps are particularly strong.",
    "Your submission success rate from mount position is 67%, which is above average for your belt level. Consider working on back control transitions.",
    "Analysis shows you're getting taken down 40% less frequently. Your takedown defense drills are paying off!",
    "Your cardio metrics indicate peak performance in rounds 1-3, with slight decline after. Consider incorporating more high-intensity interval training.",
    "Your most successful positions are: 1) Closed Guard (45% success), 2) Side Control (38%), 3) Mount (34%). Focus on improving half guard game.",
    "Recent sparring data shows increased aggression in your passing game. Your pressure passing has improved significantly.",
    "Injury risk assessment: Low. Your movement patterns show good mobility and no concerning compensation patterns.",
    "Your competition performance suggests working on mental game - you perform 15% better in training than competition environments.",
  ];

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response after a short delay
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: dummyResponses[Math.floor(Math.random() * dummyResponses.length)],
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);

    setInputMessage("");
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Chat Icon Button */}
      <motion.div
        onClick={() => setIsOpen(true)}
        className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 p-4 rounded-full text-white cursor-pointer shadow-lg z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={isOpen ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          duration: 0.3,
        }}
        style={{ pointerEvents: isOpen ? "none" : "auto" }}
      >
        <MessageCircle size={24} />
      </motion.div>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-4 bottom-20 w-80 h-[450px] rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800 shadow-2xl z-50 origin-bottom-right"
            // initial={{
            //   scale: 0,
            //   opacity: 0,
            //   x: 40,
            //   y: 40,
            // }}
            // animate={{
            //   scale: 1,
            //   opacity: 1,
            //   x: 0,
            //   y: 0,
            // }}
            // exit={{
            //   scale: 0,
            //   opacity: 0,
            //   x: 40,
            //   y: 40,
            // }}
            // transition={{
            //   type: "spring",
            //   stiffness: 300,
            //   damping: 25,
            //   duration: 1,
            // }}
          >
            {/* Header */}
            <motion.div
              className="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.3 }}
            >
              <div className="flex items-center gap-2">
                <Bot size={20} />
                <div>
                  <h3 className="font-semibold">Athlete AI</h3>
                  <p className="text-xs opacity-90">
                    Jiu-Jitsu Performance Assistant
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="hover:bg-gray-800 dark:hover:bg-white/20 rounded-full p-1 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </motion.button>
            </motion.div>

            {/* Messages Area */}
            <motion.div
              className="h-80 overflow-y-auto p-2 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {messages.length === 0 ? (
                <motion.div
                  className="text-center text-gray-500 mt-16"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                >
                  <Bot
                    size={40}
                    className="mx-auto mb-3 text-gray-400 dark:text-gray-500"
                  />
                  <p className="text-sm">Ask anything about your report</p>
                  <p className="text-xs mt-1 opacity-75">
                    I can help analyze your Jiu-Jitsu performance
                  </p>
                </motion.div>
              ) : (
                messages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${
                      message.isUser ? "justify-end" : "justify-start"
                    }`}
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                    }}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.isUser
                          ? "bg-brand-500  text-white dark:text-gray-200 rounded-br-none"
                          : "bg-gray-100 dark:bg-white/[0.05] text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-200 dark:border-gray-800"
                      }`}
                    >
                      {message.text}
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>

            {/* Input Area */}
            <motion.div
              className="p-2 border-t dark:border-gray-700"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your question..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-lg text-sm bg-white dark:bg-white/[0.03] text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-white/20 focus:border-transparent"
                />
                <motion.button
                  onClick={handleSendMessage}
                  className="bg-brand-500 hover:bg-brand-600  text-white dark:text-gray-200 p-2 rounded-lg transition-colors border border-gray-200 dark:border-gray-800"
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={16} />
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
