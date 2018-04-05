%% Function
function out = test2(in, index_in) % Comment
    persistent a index c % Comment
    if isempty(a)
        a = 1;
        c = a;
    end

    in = in.^a;
    index = index_in + 1;
    a = a*3 + c;

    %% Test section in function
    out = new_fun(index, in);

    %% Test function in function
    function y = new_fun(x, z)
        persistent y_old
        if isempty(y_old)
            y_old = 0;
        end

        y = x.^z + y_old + a;
        y_old = y;
    end
end
