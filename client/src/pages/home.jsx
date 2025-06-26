import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import axios from "axios";
import { io } from "socket.io-client";
import { IoCheckmarkOutline } from "react-icons/io5";
import { IoCheckmarkDoneOutline } from "react-icons/io5";

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
  const [roomId, setroomId] = useState(null);

  const router = useNavigate();

  const handleSubmit = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4000/api/isvalidUser",
        { withCredentials: true }
      );
      if (response.data.success) {
        setdata(response.data.user);
        setcontact(response.data.contactList);
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
        setcontact(response.data.contactList);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "User not found");
    }
  };

  const getMessage = async (id) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/getMessage",
        { roomId: id },
        { withCredentials: true }
      );
      if (response.data.success) {
        setmes(response.data.mes);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "User not found");
    }
  };

    const getContact = async () => {
    try {
      const response = await axios.get("http://localhost:4000/api/getContact", {
        withCredentials: true,
      });
      if (response.data.success) {
        setcontact(response.data.contactList);
        console.log(response.data.contactList);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "User not found");
    }
  };


  const getNotify = async (id) => {
    try {
      const response = await axios.post(
        "http://localhost:4000/api/setNotify",
        { friendId: id },
        {
          withCredentials: true,
        }
      );
      if (response.data.success) {
        setcontact(response.data.contactList);
        console.log(response.data.contactList);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "User not found");
    }
  };

  const select = async (ele) => {
    setuser(ele);
    await getMessage(ele.roomId);
    setroomId(ele.roomId);
    getNotify(ele.friendId);
  };

  const sendMessage = () => {
    const now = new Date(Date.now());

    const readableDateTime = now.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    if (!message.trim()) return;
    socket.emit("sendMessage", {
      id: user.friendId,
      message: message,
      time: readableDateTime,
      from: data.id,
      roomId: roomId,
    });
    setmes((prev) => [
      ...prev,
      { message: message, time: readableDateTime, seen: 1, from: data.id },
    ]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      if (roomId == data.roomId) {
        setmes((prev) => [
          ...prev,
          {
            message: data.message,
            time: data.time,
            seen: data.seen,
            from: data.from,
          },
        ]);
      } else {
        getContact()

        toast(() => (
          <div>
            <div className="flex flex-col gap-1">
              <div className="font-black">{data.name}</div>
              <div>{data.message}</div>
            </div>
          </div>
        ));
      }
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, [roomId]);


  useEffect(() => {
    const handleOnlineDost = async (data) => {
      await getContact();
    };

    socket.on("onlineDost", handleOnlineDost);

    return () => {
      socket.off("onlineDost", handleOnlineDost);
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
          <div className="flex  gap-1.5 w-[100vw] sm:w-[25vw] relative  sm:flex-col  sm:h-screen bg-[#ACB2AC] ">
            <div className="  flex items-center justify-between  sm:flex-col sm:w-[25vw] w-[100vw] ">
              <div className="flex p-2 gap-2">
                <img
                  src={data?.image}
                  alt="image"
                  className="h-[50px] w-[50px] rounded-full "
                />
                <div className="flex flex-col items-center gap-1">
                  <div>{data?.name}</div>
                  <div className="text-xs text-gray-600 ">{data?.contact}</div>
                </div>
              </div>
            </div>
            <div className="overflow-y-scroll your-div hidden sm:inline-block">
              <div className="text-center mx-2">
                <input
                  type="text"
                  className="bg-white text-black outline-0 rounded-[3px] "
                  placeholder="Enter Contact"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <button
                  onClick={() => {
                    addTocontact();
                  }}
                  className="bg-[#05DF72] px-1 text-center text-sm py-1"
                >
                  + Add
                </button>
              </div>
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
                      <div
                        className={`bg-red-500 h-[15px] w-[15px] flex item-center justify-center relative -top-[25px] -left-[10px] text-xs rounded-full text-white ${
                          ele?.noifiy == 0 ? "hidden" : ""
                        }`}
                      >
                        {ele?.noifiy}
                      </div>
                      <img
                        src={ele.image}
                        className="h-[30px] w-[30px] rounded-full"
                        alt=""
                      />
                      <div
                        className={`relative top-3 -left-3 h-[10px] w-[10px] rounded-full border-2 ${
                          ele.online
                            ? "border-white bg-green-700"
                            : "border-black bg-white"
                        }  `}
                      ></div>
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
            {!user ? (
              <div className="flex justify-center  items-center h-screen text-4xl font-extrabold  text-gray-600">
                Select User
              </div>
            ) : (
              <div>
                <div className=" flex w-full gap-5 items-center absolute top-0 p-2 outline-0 bg-green-100 justify-between ">
                  <div className="flex mx-3.5">
                    <img
                      src={user?.image}
                      alt="image"
                      className="h-[50px] w-[50px]  border-1 border-black rounded-full "
                    />
                    <div className="flex flex-col ">
                      <div>{user?.name}</div>
                      <div className="text-xs text-gray-600">{user?.email}</div>
                    </div>
                  </div>
                  <div className="mx-3.5">Delete</div>
                </div>
                <div
                  id="mes"
                  className="relative p-3 top-15 overflow-y-scroll h-[80vh] your-div"
                >
                  {mes.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 my-2 flex flex-col rounded-md w-fit ${
                        msg.from == data.id
                          ? "bg-green-400 ml-auto "
                          : "bg-[#acb2ac] mr-auto "
                      }`}
                    >
                      <div> {msg.message}</div>
                      <div className="flex justify-between items-center text-xs text-[#807878]">
                        <div>{msg.time}</div>
                        <div
                          className={`${msg.seen == 3 ? "text-blue-600" : ""}`}
                        >
                          {msg.seen == 1 ? (
                            <IoCheckmarkOutline />
                          ) : (
                            <IoCheckmarkDoneOutline />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className=" flex w-full gap-1 items-center  absolute bottom-2.5 outline-0  justify-center ">
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
                    <button
                      type="submit"
                      className="bg-green-800 px-3 py-3 rounded-2xl text-white"
                    >
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
