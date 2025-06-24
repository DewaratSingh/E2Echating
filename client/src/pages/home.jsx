import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io("http://localhost:4000", {
  autoConnect: false,
});

function Home() {
  const [connected, setConnected] = useState(false);
  const [data, setdata] = useState(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [contact, setcontact] = useState([]);
  const [user, setuser] = useState(null);
  const [mes, setmes] = useState([]);

  const router = useNavigate();

  const handleSubmit = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/isvalidUser",
        { withCredentials: true }
      );
      if (response.data.success) {
        setdata(response.data.user);
        setcontact(response.data.user.friends);
        const token = response.data.token;
        socket.auth = { token };
        socket.connect();
        setConnected(true);
      } else {
        router("/signIn");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
      router("/signIn");
    }
  };

  useEffect(() => {
    handleSubmit();
    socket.on("connect", () => {
      console.log("✅ Connected to Socket:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection failed:", err.message);
    });
  }, []);

  const addTocontact = async () => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/addtocontact",
        { contact: name },
        { withCredentials: true }
      );
      if (response.data.success) {
        setcontact(response.data.user.friends);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "User not found");
    }
  };

  const select = (ele) => {
    setuser(ele);
    setmes([]);
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    socket.emit("sendMessage", { id: user.id, message: message });
    setmes((prev) => [...prev, { text: message, user: true }]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setmes((prev) => [...prev, { text: data.message, user: false }]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  useEffect(() => {
    const mesDiv = document.getElementById("mes");
    mesDiv?.scrollTo({ top: mesDiv.scrollHeight, behavior: "smooth" });
  }, [mes]);

  return (
    <div>
      <ToastContainer />
      {!connected ? (
        "Connecting...!"
      ) : (
        <div className="sm:flex inline-block">
          <div className="flex  gap-1.5 w-[100vw] sm:w-[25vw]  sm:flex-col  sm:h-screen bg-[#908f8f] ">
            <div className="flex gap-2">
              <img
                src={data?.image}
                alt="image"
                className="h-[50px] w-[50px] rounded-full "
              />
              <div className="flex flex-col gap-1">
                <div>{data?.name}</div>
                <div className="text-xs text-gray-600 ">{data?.contact}</div>
              </div>
            </div>

            <hr />
            <input
              type="text"
              className="bg-white text-black outline-0"
              placeholder="Enter Contact"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              onClick={() => {
                addTocontact();
              }}
              className="bg-green-600 px-2 py-1"
            >
              Add to Contact
            </button>
            <div className="overflow-y-scroll your-div">
              {contact.map((ele, i) => {
                return (
                  <div
                    key={i}
                    onClick={() => {
                      select(ele);
                    }}
                    className="bg-green-300 p-2 m-2 rounded"
                  >
                    <div className="flex  gap-1 items-center">
                      <img
                        src={ele.image}
                        className="h-[30px] w-[30px] rounded-full"
                        alt=""
                      />
                      <div className="flex flex-col ">
                        <div>{ele.name}</div>
                        <div className="text-gray-600 text-xs">
                          {ele.contact}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="relative h-screen overflow-y-scroll w-full your-div">
            <div id="mes" className="relative top-14 overflow-y-scroll h-[75vh] your-div">
              {mes.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2 my-2 rounded-md w-fit ${
                    msg.user ? "bg-green-400 ml-auto " : "bg-gray-400 mr-auto "
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
            {!user ? (
              <div className="flex justify-center items-center h-screen text-4xl font-extrabold text-gray-600">
                Select User
              </div>
            ) : (
              <div>
                <div className=" flex w-full gap-5 items-center absolute top-0 p-2 outline-0 bg-green-100 justify-between ">
                  <div className="flex mx-3.5">
                    <img
                      src={user?.image}
                      alt="image"
                      className="h-[50px] w-[50px] rounded-full "
                    />
                    <div className="flex flex-col ">
                      <div>{user?.name}</div>
                      <div className="text-xs text-gray-600">
                        {user?.contact}
                      </div>
                    </div>{" "}
                  </div>
                  <div className="mx-3.5">Delete</div>
                </div>

                <div className=" flex w-full gap-1 items-center absolute bottom-2.5 outline-0  justify-center ">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                  >
                    <input
                      className="h-12 w-[65vw] bg-green-100"
                      type="text"
                      placeholder="Message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                    <button type="submit" className="bg-green-800 px-3 py-3 rounded-2xl text-white">
                      Send
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
